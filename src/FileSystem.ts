import path from "node:path"
import fs from "node:fs/promises"
import { $ } from "bun";

export class FileSystem {

  public cwd: string

  constructor(public rootPath: string) {
    this.cwd = ""
  }

  async openInEditor(relativePath: string, numberOfLines = 100): Promise<FileEditor> {
    const fileEditor = new FileEditor(this.rootPath, this.cwd, relativePath, numberOfLines)
    await fileEditor.readAll()
    return fileEditor
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

export class FileEditor {
  public allContent: string = ""
  private contentLines: number = 0
  private cursor = 0
  private absoluteUrl: string

  private undoStack: string[]

  constructor(public rootPath: string, public cwd: string, public relativePath: string, public numberOfLines: number) {
    this.undoStack = []
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
    return lines.map((line, index) => {
      const indexStr = (index + this.cursor).toString().padEnd(maxDigits);
      return `${indexStr} : ${line}`;
    })
  }

  async edit(start: number, end: number, replacement: string) {
    // Save the current content to the undo stack
    this.undoStack.push(this.allContent);

    const lines = this.allContent.split("\n");
    lines.splice(start, end - start, replacement);
    this.allContent = lines.join("\n");
    await fs.writeFile(this.absoluteUrl, this.allContent);

    // now let's run tsc
    const { stderr, exitCode } = await $`npx tsc --noEmit --project tsconfig.json`.nothrow().quiet();
    if (exitCode !== 0) {
      console.error("Error running tsc", stderr)
      await this.undo()
      return [false, stderr]
    }

    return [true, ""]
  }

  async undo() {
    if (this.undoStack.length > 0) {
      this.allContent = this.undoStack.pop() as string;
      await fs.writeFile(this.absoluteUrl, this.allContent);
    }
  }

  pageDown() {
    this.cursor += this.numberOfLines
    if (this.cursor > (this.contentLines - this.numberOfLines)) {
      this.cursor = this.contentLines - this.numberOfLines
    }
    return this.readPage().join("\n")
  }

  pageUp() {
    this.cursor -= this.numberOfLines
    if (this.cursor < 0) {
      this.cursor = 0
    }
    return this.readPage().join('\n')
  }
}