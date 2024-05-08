import { MentalProcess } from "@opensouls/engine";
import summarizesConversation from "../cognitiveFunctions/summarizeConversation.js";

const summarizeProcess: MentalProcess = async ({ workingMemory }) => {
  return workingMemory
  // return summarizesConversation({ workingMemory })
}

export default summarizeProcess
