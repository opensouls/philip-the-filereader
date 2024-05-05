
import { MentalProcess, useActions } from "@opensouls/engine";
import externalDialog from "./cognitiveSteps/externalDialog.js";
import exploreFilesystem from "./mentalProcesses/exploreFilesystem.js";

const initialProcess: MentalProcess = async ({ workingMemory }) => {
  const { speak  } = useActions()

  const [withDialog, stream] = await externalDialog(
    workingMemory,
    "Tell the interlocutor that you're excited to see you're code.",
    { stream: true, model: "quality" }
  );
  speak(stream);

  return [withDialog, exploreFilesystem, { executeNow: true }];
}

export default initialProcess
