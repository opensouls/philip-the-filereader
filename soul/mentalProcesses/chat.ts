
import { MentalProcess, useActions } from "@opensouls/engine";
import externalDialog from "../cognitiveSteps/externalDialog.js";
import mentalQuery from "../cognitiveSteps/mentalQuery.js";
import exploreFilesystem from "./exploreFilesystem.js";
import { BIG_MODEL, FAST_MODEL } from "../lib/models.js";

const chats: MentalProcess = async ({ workingMemory }) => {
  const { speak  } = useActions()

  const [withDialog, stream] = await externalDialog(
    workingMemory,
    "Talk to the user about their codebase.",
    { stream: true, model: FAST_MODEL }
  );
  speak(stream);

  const [, wantsToGoAgain] = await mentalQuery(
    workingMemory,
    "Philip has finished conversing with the interloctur and wants to explore his filesystem again.",
    {
      model: BIG_MODEL
    }
  )

  if (wantsToGoAgain) {
    const [withFollowup, stream] = await externalDialog(
      withDialog,
      "Tell the interlocutor that you're going to look at a few more files.",
      { stream: true, model: BIG_MODEL }
    );

    speak(stream);

    return [withFollowup, exploreFilesystem, { executeNow: true }]
  }

  return withDialog;
}

export default chats
