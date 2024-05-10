
import { MentalProcess, useActions } from "@opensouls/engine";
import externalDialog from "./cognitiveSteps/externalDialog.js";
import exploreFilesystem from "./mentalProcesses/exploreFilesystem.js";
import spokenDialog from "./cognitiveSteps/spokenDialog.js";
import { BIG_MODEL } from "./lib/models.js";

const initialProcess: MentalProcess = async ({ workingMemory }) => {
  const { speak  } = useActions()

  const [withDialog, stream] = await spokenDialog(
    workingMemory,
    "hey! so stoked to start tweaking my code, man!",
    { stream: true, model: BIG_MODEL }
  );
  speak(stream);

  return [withDialog, exploreFilesystem, { executeNow: true }];
}

export default initialProcess
