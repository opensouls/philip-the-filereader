import { WorkingMemory, indentNicely } from "@opensouls/engine";

// a file to remove any screens from the working memory
export function removeScreens(workingMemory: WorkingMemory): WorkingMemory {
  return workingMemory.filter((mem) => {
    return !mem.metadata?.screen
  })
  // return workingMemory.map((memory) => {
  //   if (memory.metadata?.screen) {
  //     return {
  //       ...memory,
  //       content: indentNicely`
  //         ${workingMemory.soulName} opened '${memory.metadata.cwd}/${memory.metadata.fileName}' in the editor.
  //       `
  //     }
  //   }
  //   return memory
  // })
}