import { ActionEvent, Soul } from "@opensouls/engine"
import { FileSystem, FileReader } from "./FileReader.js"

export class SoulBrowser {
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
      action: "listed",
      content: list.join("\n"),
      _metadata: {
        cwd: this.fileSystem.cwd
      }
    })
  }

  async onCd(evt: ActionEvent) {
    console.log("on cd event", await evt.content())
   
    const list = await this.fileSystem.changeDirectory(await evt.content())

    this.soul.dispatch({
      action: "changedDirectory",
      content: list.join("\n"),
      _metadata: {
        cwd: this.fileSystem.cwd
      }
    })
  }

  async onRead(evt: ActionEvent) {
    console.log("on read event", await evt.content())
   
    const fileReader = await this.fileSystem.read(await evt.content())
    this.reader = fileReader

    this.soul.dispatch({
      action: "readFile",
      content: fileReader.allContent
    })
  }

  async onPagDown(_evt: ActionEvent) {
    if (!this.reader) {
      throw new Error("Reader not initialized")
    }
   
    const content = this.reader.pageDown()

    this.soul.dispatch({
      action: "pagedDown",
      content,
    })
  }

  async onPageUp(_evt: ActionEvent) {
    if (!this.reader) {
      throw new Error("Reader not initialized")
    }
   
    const content = this.reader.pageUp()

    this.soul.dispatch({
      action: "pagedUp",
      content,
    })
  }
}