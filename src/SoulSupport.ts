import { ActionEvent, Soul, indentNicely } from "@opensouls/engine"
import { FileSystem, FileEditor } from "./FileSystem.js"
import { speakPlayHT } from "./audio/playht.js"
import { Readable } from "node:stream"
import player from "play-sound"
import { rm, exists } from "node:fs/promises"
import path from "node:path"
import { log } from "./timedLog.js"

export class SoulSupport {
  soul
  fileSystem
  reader?: FileEditor
  speakingPromise?: Promise<void>

  constructor() {
    this.fileSystem = new FileSystem("./")
    this.soul = new Soul({
      organization: process.env.SOUL_ENGINE_ORG!,
      blueprint: "philip-the-fileman",
      soulId: "reader2",
      local: true,
      debug: true,
      token: process.env.SOUL_ENGINE_TOKEN,
    })

    this.soul.on("says", this.onSays.bind(this))
    this.soul.on("ls", this.onLs.bind(this))
    this.soul.on("cd", this.onCd.bind(this))
    this.soul.on("openInEditor", this.openInEditor.bind(this))
    this.soul.on("pageDown", this.onPageDown.bind(this))
    this.soul.on("pageUp", this.onPageUp.bind(this))

    this.soul.on("editLines", this.onEditLines.bind(this))
    this.soul.on("fileATicket", this.onFileATicket.bind(this))
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
    log("on says event", await evt.content(), evt._metadata)
    // const mp3Stream = await speakPlayHT(Readable.from(evt.stream()))

    // await this.waitForSpeaking()
    // this.speakingPromise = new Promise<void>(async (resolve, reject) => {
    //   await rm("speaking.mp3", { force: true })

    //   const timeoutId = setTimeout(() => {
    //     console.error("mp3 playback timeout, ignoring")
    //     mp3Stream.off("data", onData)
    //     mp3Stream.off("end", onEnd)
    //     // mp3Stream
    //     resolve()
    //   }, 15_000)

    //   console.log('writing mp3')
    //   const writeStream = Bun.file("speaking.mp3").writer()

    //   const onData = (chunk: Buffer) => {
    //     writeStream.write(chunk)
    //   }
    //   const onEnd = async () => {
    //     mp3Stream.off("data", onData)
    //     mp3Stream.off("end", onEnd)
    //     await writeStream.end()

    //     console.log("playing mp3")

    //     player().play("speaking.mp3", (err) => {
    //       console.log("mp3 complete")
    //       clearTimeout(timeoutId)
    //       if (err) {
    //         console.error("error playing mp3, ignoring", err)
    //         resolve()
    //         return
    //       }
    //       resolve()
    //     })
    //   }

    //   mp3Stream.on("data", onData)
    //   mp3Stream.on("end", onEnd)
    // })
  }

  async onLs(evt: ActionEvent) {
    log("on ls event", await evt.content())

    const list = await this.fileSystem.list()

    await this.waitForSpeaking()
    this.soul.dispatch({
      name: "Philip",
      action: `listed the directory ${this.fileSystem.cwd} and found ${list.length} entries: \n`,
      content: list.map(entry => `${entry.name} ${entry.isDirectory ? "<DIR>" : "<FILE>"}`).join("\n"),
      _metadata: {
        cwd: this.fileSystem.cwd,
        list,
      }
    })
  }

  async onEditLines(evt: ActionEvent) {
    log("on edit event", await evt.content(), evt._metadata)

    if (!this.reader) {
      throw new Error("Reader not initialized")
    }

    const { start, end, replacement } = evt._metadata as { start: number, end: number, replacement: string }
    
    log("editing lines", this.reader.relativePath, start, end, replacement)
    const [isSuccess, errorText] = await this.reader.edit(start, end, replacement)
    
    await this.waitForSpeaking()

    if (isSuccess) {
      this.soul.dispatch({
        name: "Philip",
        action: "edited",
        content: `Philip edited the file ${this.reader.relativePath} from line ${start} to ${end} with "${replacement}".`,
        _metadata: {
          cwd: this.reader.cwd,
          fileName: this.reader.relativePath,
          screen: this.reader.readPage().join("\n"),
        }
      })

      return
    }

    console.error("error editing file", errorText)

    this.soul.dispatch({
      name: "Philip",
      action: "failed to edit",
      content: indentNicely`
        the file ${this.reader.relativePath} from line ${start} to ${end} with "${replacement}". 
        Error from running 'npx tsc': 
        > ${errorText.split("\n").slice(0, 6).join("\n")}

        The change has been undone automatically.
      `,
      _metadata: {
        cwd: this.reader.cwd,
        fileName: this.reader.relativePath,
        screen: this.reader.readPage().join("\n"),
      }
    })
  }

  async onCd(evt: ActionEvent) {
    log("on cd event", await evt.content(), JSON.stringify(evt._metadata))

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

  async openInEditor(evt: ActionEvent) {
    log("on read event", await evt.content(), evt._metadata)

    const fileName = evt._metadata?.file as string
    await this.waitForSpeaking()

    if (fileName.trim() === ".env") {
      return  this.soul.dispatch({
        name: "Philip",
        action: "readFile",
        content: `Philip tried to open '${evt._metadata?.file}' in the editor, but was denied access.`,
        _metadata: {
          cwd: this.fileSystem.cwd,
          fileName: evt._metadata?.file as string,
          screen: "access denied",
          largeChunk: "access denied"
        }
      })
    }

    if (!(await exists(path.join(this.fileSystem.cwd, fileName)))) {
      return  this.soul.dispatch({
        name: "Philip",
        action: "tried to open",
        content: `'${evt._metadata?.file}' but there is no such file in the current working directory.`,
        _metadata: {
          cwd: this.fileSystem.cwd,
          fileName: evt._metadata?.file as string,
          missingFile: true,
        }
      })
    }

    const fileReader = await this.fileSystem.openInEditor(fileName)
    this.reader = fileReader

    this.soul.dispatch({
      name: "Philip",
      action: "readFile",
      content: `'${evt._metadata?.file}' in the editor.`,
      _metadata: {
        cwd: this.fileSystem.cwd,
        fileName: evt._metadata?.file as string,
        screen: fileReader.readPage().join("\n"),
        largeChunk: fileReader.allContent.split("\n").slice(0, 400).join("\n")
      }
    })
  }

  async onPageDown(_evt: ActionEvent) {
    log("page down event")
    if (!this.reader) {
      throw new Error("Reader not initialized")
    }

    const content = this.reader.pageDown()

    await this.waitForSpeaking()
    log('shipping page down')

    this.soul.dispatch({
      name: "Philip",
      action: "pagedDown",
      content: "in the file.",
      _metadata: {
        cwd: this.reader.cwd,
        fileName: this.reader.relativePath,
        screen: content,
      }
    })
  }

  async onPageUp(_evt: ActionEvent) {
    log("page up event")
    if (!this.reader) {
      throw new Error("Reader not initialized")
    }

    const content = this.reader.pageUp()

    await this.waitForSpeaking()

    log('shipping page up')
    this.soul.dispatch({
      name: "Philip",
      action: "pagedUp",
      content: "in the file.",
      _metadata: {
        cwd: this.reader.cwd,
        fileName: this.reader.relativePath,
        screen: content,
      }
    })
  }

  async onFileATicket(evt: ActionEvent) {
    log("------> on file a ticket event\n", JSON.stringify(evt._metadata, null, 2))
    const { content } = evt._metadata as { content: string }

    await this.waitForSpeaking()

    this.soul.dispatch({
      name: "Philip",
      action: "filed",
      content: `a ticket with the subject: ${evt._metadata?.subject}`,
      _metadata: {
        content,
      }
    })
  }
}
