
import { MentalProcess, useActions } from "@opensouls/engine";
import externalDialog from "../cognitiveSteps/externalDialog.js";
import mentalQuery from "../cognitiveSteps/mentalQuery.js";
import exploreFilesystem from "./exploreFilesystem.js";

const chats: MentalProcess = async ({ workingMemory }) => {
  const { speak  } = useActions()

  const [withDialog, stream] = await externalDialog(
    workingMemory,
    "Talk to the user about their codebase.",
    { stream: true, model: "quality" }
  );
  speak(stream);

  const [, wantsToGoAgain] = await mentalQuery(
    workingMemory,
    "Philip wants to explore his code again.",
    {
      model: "exp/llama-v3-70b-instruct"  
    }
  )

  if (wantsToGoAgain) {
    const [withFollowup, stream] = await externalDialog(
      withDialog,
      "Tell the interlocutor that you're going to look at a few more files.",
      { stream: true, model: "quality" }
    );

    speak(stream);

    return [withFollowup, exploreFilesystem, { executeNow: true }]
  }

  return withDialog;
}

export default chats
