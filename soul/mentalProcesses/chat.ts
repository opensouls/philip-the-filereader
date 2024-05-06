
import { MentalProcess, useActions } from "@opensouls/engine";
import externalDialog from "../cognitiveSteps/externalDialog.js";
import mentalQuery from "../cognitiveSteps/mentalQuery.js";
import exploreFilesystem from "./exploreFilesystem.js";

const chats: MentalProcess = async ({ workingMemory }) => {
  const { speak  } = useActions()

  const [withDialog, stream] = await externalDialog(
    workingMemory,
    "Talk to the user about their codebase.",
    { stream: true, model: "gpt-4-turbo" }
  );
  speak(stream);

  const [, wantsToGoAgain] = await mentalQuery(
    workingMemory,
    "Philip has finished conversing with the interloctur and wants to explore his filesystem again.",
    {
      model: "gpt-4-turbo"  
    }
  )

  if (wantsToGoAgain) {
    const [withFollowup, stream] = await externalDialog(
      withDialog,
      "Tell the interlocutor that you're going to look at a few more files.",
      { stream: true, model: "gpt-4-turbo" }
    );

    speak(stream);

    return [withFollowup, exploreFilesystem, { executeNow: true }]
  }

  return withDialog;
}

export default chats
