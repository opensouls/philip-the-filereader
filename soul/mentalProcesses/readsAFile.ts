
import { MentalProcess, indentNicely, useActions, usePerceptions, useProcessManager, useSoulMemory, z } from "@opensouls/engine";
import externalDialog from "../cognitiveSteps/externalDialog.js";
import { ToolPossibilities, toolChooser } from "../cognitiveFunctions/toolChooser.js";
import decision from "../cognitiveSteps/decision.js";
import instruction from "../cognitiveSteps/instruction.js";
import exploreFilesystem from "./exploreFilesystem.js";
import { updateNotes } from "../cognitiveFunctions/notes.js";

const tools: ToolPossibilities = {
  "pageUp": {
    description: "Page up in the current file.",
  },
  "pageDown": {
    description: "Page down in the current file.",
  },
  "exit": {
    description: "Exit reading the current file",
  }
}

const readsAFile: MentalProcess = async ({ workingMemory }) => {
  const { speak, log  } = useActions()
  const { invokingPerception } = usePerceptions()

  if (invokingPerception?.action === "readFile") {
    // this is the whole file, so should only come through as a summary to the soul.
    // slice off the last memory
    workingMemory = workingMemory.slice(0, -1)
    // summarize
    const { cwd, fileName, largeChunk: content } = invokingPerception._metadata! as { cwd: string, fileName: string, largeChunk: string }

    log(`read file ${fileName} in ${cwd}`)

    const [, summary] = await instruction(
      workingMemory,
      indentNicely`
        ${workingMemory.soulName} just opened the file.

        ## File '${cwd}/${fileName}' (max first 400 lines)
        ${content}

        Please return a 1-3 sentence version of what ${workingMemory.soulName} would notice first about the file when skimming it.
      `
    )
    workingMemory = workingMemory.withMonologue(indentNicely`
      ${workingMemory.soulName} just opened the file File '${cwd}/${fileName}' in their editor.
      
      Here's what they noticed first about the file:
      ${summary}
    `)
  }

  if (invokingPerception?._metadata?.screen) {
    workingMemory = workingMemory.withMonologue(indentNicely`
      ${workingMemory.soulName} is using an editor that shows the lines of the editor 100 at at time.
      
      ## Editor
      ${invokingPerception._metadata.screen}
    `)
  }

  log("making a comment")
  const [withDialog, stream] = await externalDialog(
    workingMemory,
    "Make a comment on what they are seeing.",
    { stream: true, model: "gpt-4-turbo" }
  );
  speak(stream);

  await updateNotes(withDialog)

  log("choosing tools")
  const [toolMemory, toolChoice, args] = await toolChooser(withDialog, tools)
  
  log("Tool choice: ", toolChoice, "Args: ", args)

  if (toolChoice === "exit") {
    return [toolMemory, exploreFilesystem, { executeNow: true }]
  }

  return toolMemory;
}

export default readsAFile;
