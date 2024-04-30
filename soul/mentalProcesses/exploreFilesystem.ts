
import { MentalProcess, indentNicely, useActions, usePerceptions, useProcessManager, useSoulMemory, z } from "@opensouls/engine";
import externalDialog from "../cognitiveSteps/externalDialog.js";
import { ToolPossibilities, toolChooser } from "../cognitiveFunctions/toolChooser.js";
import readsAFile from "./readsAFile.js";
import chats from "./chat.js";
import { updateNotes } from "../cognitiveFunctions/notes.js";

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
  const { speak, dispatch, log  } = useActions()
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

  // if (invokingPerception?.action === "listed") {
  //   log("setting latest list")
  //   latestList.current = [...invokingPerception._metadata!.list as ListEntry[]]
  // }

  log("making a comment")
  const [withDialog, resp] = await externalDialog(
    workingMemory,
    "Make a comment on what they are seeing.",
    { model: "quality" }
  );
  speak(resp);

  await updateNotes(withDialog)

  log("choosing tools")
  const [toolMemory, toolChoice, args] = await toolChooser(withDialog, tools)
  
  log("Tool choice: ", toolChoice, "Args: ", args)
  if (toolChoice === "read") {
    return [toolMemory, readsAFile]
  }

  if (toolChoice === "stop") {
    return [toolMemory, chats, { executeNow: true }]
  }

  return toolMemory;
}

export default exploreFilesystem;
