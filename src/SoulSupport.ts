import { ActionEvent, Soul } from "@opensouls/engine"
import { FileSystem, FileReader } from "./FileReader.js"
import { speakPlayHT } from "./audio/playht.js"
import { Readable } from "node:stream"
import player from "play-sound"
import { rm } from "node:fs/promises"

export class SoulSupport {
  soul
  fileSystem
  reader?: FileReader
  speakingPromise?: Promise<void>

  constructor() {
    this.fileSystem = new FileSystem("./")
    this.soul = new Soul({
      organization: "tobowers",
      blueprint: "philip-the-fileman",
      soulId: "reader1",
      local: true,
      debug: true,
      token: process.env.SOUL_ENGINE_TOKEN,
    })
    this.soul.on("says", this.onSays.bind(this))
    this.soul.on("ls", this.onLs.bind(this))
    this.soul.on("cd", this.onCd.bind(this))
    this.soul.on("read", this.read.bind(this))
    this.soul.on("pageDown", this.onPageDown.bind(this))
    this.soul.on("pageUp", this.onPageUp.bind(this))
  }

  async start() {
    await this.soul.connect()
  }

  async stop() {
    await this.soul.disconnect()
  }

  async waitForSpeaking() {
    if (this.speakingPromise) {
      console.log('waiting for speech to finish')
      await this.speakingPromise
    }
  }

  async onSays(evt: ActionEvent) {
    const mp3Stream = await speakPlayHT(Readable.from(evt.stream()))
    // const pcmStream = mp3ToPCM(mp3Stream, controller.signal)

    await this.waitForSpeaking()
    this.speakingPromise = new Promise<void>(async (resolve, reject) => {
      await rm("speaking.mp3", { force: true })

      console.log('writing mp3')
      const writeStream = Bun.file("speaking.mp3").writer()
      for await (const chunk of mp3Stream) {
        writeStream.write(chunk)
      }
      writeStream.end()

      console.log("playing mp3")
      player().play("speaking.mp3", (err) => {
        console.log("mp3 complete")
        if (err) {
          console.error("error playing mp3", err)
          reject(err)
          return
        }
        resolve()
      })
    })
  }

  async onLs(evt: ActionEvent) {
    console.log("on ls event", await evt.content())

    const list = await this.fileSystem.list()

    await this.waitForSpeaking()
    this.soul.dispatch({
      name: "Philip",
      action: "listed",
      content: list.map(entry => `${entry.name} ${entry.isDirectory ? "<DIR>" : "<FILE>"}`).join("\n"),
      _metadata: {
        cwd: this.fileSystem.cwd,
        list,
      }
    })
  }

  async onCd(evt: ActionEvent) {
    console.log("on cd event", await evt.content(), JSON.stringify(evt._metadata))

    const list = await this.fileSystem.changeDirectory(evt._metadata?.directory as string)

    await this.waitForSpeaking()

    this.soul.dispatch({
      name: "Philip",
      action: "changedDirectory",
      content: list.map(entry => `${entry.name} ${entry.isDirectory ? "<DIR>" : "<FILE>"}`).join("\n"),
      _metadata: {
        cwd: this.fileSystem.cwd,
        list,
      }
    })
  }

  async read(evt: ActionEvent) {
    console.log("on read event", await evt.content(), evt._metadata)

    const fileReader = await this.fileSystem.read(evt._metadata?.file as string)
    this.reader = fileReader

    await this.waitForSpeaking()

    this.soul.dispatch({
      name: "Philip",
      action: "readFile",
      content: "Philip opened a file in the editor.",
      _metadata: {
        cwd: this.fileSystem.cwd,
        fileName: evt._metadata?.file as string,
        screen: fileReader.readPage().join("\n"),
        largeChunk: fileReader.allContent.split("\n").slice(0, 400).join("\n")
      }
    })
  }

  async onPageDown(_evt: ActionEvent) {
    console.log("page down event")
    if (!this.reader) {
      throw new Error("Reader not initialized")
    }

    const content = this.reader.pageDown()

    await this.waitForSpeaking()
    console.log('shipping page down')

    this.soul.dispatch({
      name: "Philip",
      action: "pagedDown",
      content: "Philip paged down",
      _metadata: {
        cwd: this.reader.cwd,
        fileName: this.reader.relativePath,
        screen: content,
      }
    })
  }

  async onPageUp(_evt: ActionEvent) {
    console.log("page up event")
    if (!this.reader) {
      throw new Error("Reader not initialized")
    }

    const content = this.reader.pageUp()

    await this.waitForSpeaking()
    console.log('shipping page up')
    this.soul.dispatch({
      name: "Philip",
      action: "pagedUp",
      content: "Philip paged up",
      _metadata: {
        cwd: this.reader.cwd,
        fileName: this.reader.relativePath,
        screen: content,
      }
    })
  }
}