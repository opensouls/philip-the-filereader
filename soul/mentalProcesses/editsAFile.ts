
import { MentalProcess, indentNicely, useActions, usePerceptions, useProcessManager, useSoulMemory, useSoulStore, z } from "@opensouls/engine";
import externalDialog from "../cognitiveSteps/externalDialog.js";
import { ToolPossibilities, toolChooser } from "../cognitiveFunctions/toolChooser.js";
import instruction from "../cognitiveSteps/instruction.js";
import exploreFilesystem from "./exploreFilesystem.js";
import { updateNotes } from "../cognitiveFunctions/notes.js";
import internalMonologue from "../cognitiveSteps/internalMonologue.js";
import spokenDialog from "../cognitiveSteps/spokenDialog.js";

const tools: ToolPossibilities = {
  "pageUp": {
    description: "Page up in the current file.",
  },
  "pageDown": {
    description: "Page down in the current file.",
  },
  "edit": {
    description: indentNicely`
      Edit a section of the file.
      Philip provides the start and end lines to edit and the replacement text. The new lines will completely replace the existing lines.
      If Philip is editing code, then make sure to return actual *code* (and ONLY code), not commentary.
    `,
    params: z.object({
      start: z.number().describe("starting line number."),
      end: z.number().describe("ending line number."),
      replacement: z.string().describe("the text to replace the lines with."),
    })
  },
  "exit": {
    description: "Exit reading the current file",
  }
}

const editsAFile: MentalProcess = async ({ workingMemory }) => {
  const { speak, log  } = useActions()
  const { invokingPerception } = usePerceptions()
  const { set } = useSoulStore()

  const { cwd, fileName } = invokingPerception!._metadata! as { cwd: string, fileName: string }

  if (invokingPerception?.action === "readFile") {
    // this is the whole file, so should only come through as a summary to the soul.
    // slice off the last memory
    workingMemory = workingMemory.slice(0, -1)
    // summarize
    const { largeChunk: content } = invokingPerception._metadata! as { cwd: string, fileName: string, largeChunk: string }

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
      ${workingMemory.soulName} is using an editor that shows up to 100 lines of the file at a time.
      
      ## Editor
      ${invokingPerception._metadata.screen}
    `)
  }

  const [withMonologue, monologue] = await internalMonologue(
    workingMemory,
    `What are ${workingMemory.soulName}'s takeaways from what they are reading and what they'd like to do?`,
    {
      model: "gpt-4-turbo",
    }
  )

  log("making a comment")
  const [withDialog, stream, resp] = await spokenDialog(
    withMonologue,
    `${workingMemory.soulName} thinks out loud (under their breath) about what they are reading.`,
    { stream: true, model: "gpt-4-turbo" }
  );
  speak(stream);

  await updateNotes(withDialog)

  log("choosing tools")
  const [toolMemory, toolChoice, args] = await toolChooser(withDialog, tools)
  
  log("Tool choice: ", toolChoice, "Args: ", args)

  // strip off any screens, etc
  const cleanedMemory = withDialog
    .withMonologue(indentNicely`
      After looking at the screen and thinking
      > ${monologue}
      ${workingMemory.soulName} decided to call the tool: ${toolChoice} with the argument ${JSON.stringify(args)}.
    `)

  if (toolChoice === "exit") {
    // let's create a takeaway from this file
    const [, takeaway] = await instruction(
      cleanedMemory,
      indentNicely`
        ${workingMemory.soulName} just decided to stop reading the file: ${cwd}/${fileName}.
        
        ## Their Thoughts
        ${monologue}

        Write a 1 paragraph takewaway on all that ${workingMemory.soulName} learned from the file related to their goals. Espcially keep details they would want to remember when scanning the file system for file names again.
      `,
      {
        model: "exp/llama-v3-70b-instruct",
      }
    )

    log("takeaway: ", takeaway)
    set(`${cwd}/${fileName}`, takeaway)

    return [cleanedMemory, exploreFilesystem, { executeNow: true }]
  }

  return cleanedMemory;
}

export default editsAFile;
