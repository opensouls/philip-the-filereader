
import { MentalProcess, indentNicely, useActions, usePerceptions, useProcessManager, useSoulMemory, z } from "@opensouls/engine";
import externalDialog from "../cognitiveSteps/externalDialog.js";
import { ToolPossibilities, toolChooser } from "../cognitiveFunctions/toolChooser.js";
import readsAFile from "./readsAFile.js";
import chats from "./chat.js";
import { updateNotes } from "../cognitiveFunctions/notes.js";
import internalMonologue from "../cognitiveSteps/internalMonologue.js";
import spokenDialog from "../cognitiveSteps/spokenDialog.js";

const tools: ToolPossibilities = {
  "cd": {
    description: "Change directory to a directory in the filesystem",
    params: z.object({
      directory: z.string().describe("The directory to change to")
    })
  },
  "ls": {
    description: "List the files in the current directory",
  },
  "read": {
    description: "Opens a file in the current directory in an editor that shows the file 100 lines at a time.",
    params: z.object({
      file: z.string().describe("The file to read")
    })
  },
  "stop": {
    description: "Stops exploring the file system and chats with the user (after Philip has a good understanding of the codebase).",
  },
}

const exploreFilesystem: MentalProcess = async ({ workingMemory }) => {
  const { speak, dispatch, log } = useActions()
  const { invocationCount } = useProcessManager()
  // const { invokingPerception } = usePerceptions()
  // const latestList = useSoulMemory<ListEntry[]>("latestList", [])

  if (invocationCount === 0) {
    log("dispatching ls")
    dispatch({
      action: "ls",
      content: ""
    })
    return workingMemory.withMonologue("Philip lists the files in the current directory.")
  }

  const [withMonologue, monologue] = await internalMonologue(
    workingMemory,
    `What are ${workingMemory.soulName}'s takeaways from that file list, to their goal?`,
    {
      model: "gpt-4-turbo",
    }
  )

  log("making a comment")
  const [withDialog, resp] = await spokenDialog(
    withMonologue,
    `${workingMemory.soulName} thinks out loud (under their breath) about what they are reading.`,
    { model: "gpt-4-turbo" }
  );
  speak(resp);

  await updateNotes(withDialog)

  log("choosing tools")
  const [toolMemory, toolChoice, args] = await toolChooser(withDialog, tools)

  log("Tool choice: ", toolChoice, "Args: ", args)
  if (toolChoice === "read") {
    return [toolMemory, readsAFile]
  }

  // strip off the actual list of files
  const cleanedMemory = workingMemory
    .slice(0, -1)
    .concat(withDialog.slice(-1))
    .withMonologue(indentNicely`
      After looking at the list of files and thinking
      > ${monologue}
      ${workingMemory.soulName} decided to call the tool: ${toolChoice} with the argument ${JSON.stringify(args)}.
    `)


  if (toolChoice === "stop") {
    return [toolMemory, chats, { executeNow: true }]
  }

  return toolMemory;
}

export default exploreFilesystem;
