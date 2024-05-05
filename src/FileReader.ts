import path from "node:path"
import fs from "node:fs/promises"

export class FileSystem {

  public cwd: string

  constructor(public rootPath: string) {
    this.cwd = ""
  }

  async isDirectory(relativePath: string) {
    const stats = await fs.stat(path.join(this.rootPath, this.cwd, relativePath))
    return stats.isDirectory()
  }

  async read(relativePath: string, numberOfLines = 100): Promise<FileReader> {
    const fileReader = new FileReader(this.rootPath, this.cwd, relativePath, numberOfLines)
    await fileReader.readAll()
    return fileReader
  }

  async list() {
    const dirPath = path.join(this.rootPath, this.cwd);
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    return entries.map(entry => {
      return {
        name: entry.name,
        isDirectory: entry.isDirectory(),
      }
    }).concat([{ name: "..", isDirectory: true }]);
  }

  async changeDirectory(relativePath: string) {
    console.log("cd: ", relativePath)
    this.cwd = path.join(this.cwd, relativePath)
    return this.list()
  }
}

export class FileReader {
  public allContent: string = ""
  private contentLines: number = 0
  private cursor = 0
  private absoluteUrl: string

  constructor(public rootPath: string, public cwd: string, public relativePath: string, public numberOfLines: number) {
    this.absoluteUrl = path.join(rootPath, cwd, relativePath)
  }

  async readAll() {
    this.allContent = await Bun.file(this.absoluteUrl).text()
    this.contentLines = this.allContent.split("\n").length
    return this.allContent
  }

  readPage() {
    const lines = this.allContent.split("\n")
    const maxDigits = lines.length.toString().length;
    const pageLines = lines.map((line, index) => {
      const indexStr = (index + this.cursor).toString().padEnd(maxDigits);
      return `${indexStr} : ${line}`;
    });
    if (this.cursor + this.numberOfLines >= this.contentLines) {
      pageLines.push("<eof>");
    }
    return pageLines;
  }

  pageDown() {
    if (this.cursor >= (this.contentLines - this.numberOfLines)) {
      return [];
    }

    this.cursor += this.numberOfLines
    if (this.cursor > (this.contentLines - this.numberOfLines)) {
      this.cursor = this.contentLines - this.numberOfLines
    }
    return this.readPage().join("\n")
  }

  pageUp() {
    if (this.cursor === 0) {
      return [];
    }
    this.cursor -= this.numberOfLines
    if (this.cursor < 0) {
      this.cursor = 0
    }
    return this.readPage().join('\n')
  }
}