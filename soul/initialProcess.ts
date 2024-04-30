
import { MentalProcess, useActions } from "@opensouls/engine";
import externalDialog from "./cognitiveSteps/externalDialog.js";
import exploreFilesystem from "./mentalProcesses/exploreFilesystem.js";

const initialProcess: MentalProcess = async ({ workingMemory }) => {
  const { speak  } = useActions()

  const [withDialog, stream] = await externalDialog(
    workingMemory,
    "Tell the user you're excited to read through their file system and figure out their code.",
    { stream: true, model: "quality" }
  );
  speak(stream);

  return [withDialog, exploreFilesystem, { executeNow: true }];
}

export default initialProcess
