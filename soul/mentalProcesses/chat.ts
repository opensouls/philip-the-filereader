
import { MentalProcess, useActions } from "@opensouls/engine";
import externalDialog from "../cognitiveSteps/externalDialog.js";

const chats: MentalProcess = async ({ workingMemory }) => {
  const { speak  } = useActions()

  const [withDialog, stream] = await externalDialog(
    workingMemory,
    "Talk to the user about their codebase.",
    { stream: true, model: "quality" }
  );
  speak(stream);

  return withDialog;
}

export default chats
