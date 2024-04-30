import { ActionEvent, Soul } from "@opensouls/engine"
import { FileSystem, FileReader } from "./FileReader.js"

export class SoulSupport {
  soul
  fileSystem
  reader?: FileReader

  constructor() {
    this.fileSystem = new FileSystem("../readerman")
    this.soul = new Soul({
      organization: "tobowers",
      blueprint: "philip-the-fileman",
      soulId: "reader1",
      local: true,
      debug: true,
      token: process.env.SOUL_ENGINE_TOKEN,
    })
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

  async onLs(evt: ActionEvent) {
    console.log("on ls event", await evt.content())

    const list = await this.fileSystem.list()

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
    if (!this.reader) {
      throw new Error("Reader not initialized")
    }

    const content = this.reader.pageDown()

    this.soul.dispatch({
      name: "Philip",
      action: "pagedDown",
      content: "Philip paged down",
      _metadata: {
        screen: content,
      }
    })
  }

  async onPageUp(_evt: ActionEvent) {
    if (!this.reader) {
      throw new Error("Reader not initialized")
    }

    const content = this.reader.pageUp()

    this.soul.dispatch({
      name: "Philip",
      action: "pagedUp",
      content: "Philip paged up",
      _metadata: {
        screen: content,
      }
    })
  }
}