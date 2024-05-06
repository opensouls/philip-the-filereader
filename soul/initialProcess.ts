
import { MentalProcess, useActions } from "@opensouls/engine";
import externalDialog from "./cognitiveSteps/externalDialog.js";
import exploreFilesystem from "./mentalProcesses/exploreFilesystem.js";
import spokenDialog from "./cognitiveSteps/spokenDialog.js";
import { BIG_MODEL } from "./lib/models.js";

const initialProcess: MentalProcess = async ({ workingMemory }) => {
  const { speak  } = useActions()

  const [withDialog, stream] = await spokenDialog(
    workingMemory,
    "Tell the interlocutor that you're excited to see you're code.",
    { stream: true, model: BIG_MODEL }
  );
  speak(stream);

  return [withDialog, exploreFilesystem, { executeNow: true }];
}

export default initialProcess
