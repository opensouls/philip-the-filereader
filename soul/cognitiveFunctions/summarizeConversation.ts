
import { ChatMessageRoleEnum, WorkingMemory, createCognitiveStep, indentNicely, useActions, useSoulMemory } from "@opensouls/engine";
import { FAST_MODEL } from "../lib/models.js";
import { INITIAL_SUMMARY } from "../lib/initialStates.js";

const conversationNotes = createCognitiveStep((existing: string) => {
  return {
    command: ({ soulName: name }: WorkingMemory) => {
      return {
        role: ChatMessageRoleEnum.System,
        content: indentNicely`
          ## Existing notes
          ${existing}

          ## Description
          ${name} needs to step away from this conversation and hand it off to another person. They need to make sure that person can pick up exactly where ${name} left off. However, that person has a short attention span, so ${name} needs to communicate all the details in a concise, interesting manner, while keeping necessary details.

          ## Rules
          * Keep notes as paragraph(s)
          * Use abbreviated language to keep the notes short

          Please reply with the updated notes on the conversation:
        `,
      }
    },
  }
})

const summarizesConversation = async ({ workingMemory }: { workingMemory: WorkingMemory }) => {
  const conversationSummary = useSoulMemory("conversationSummary", INITIAL_SUMMARY)
  const { log } = useActions()

  let memory = workingMemory

  if (memory.memories.length > 8) {
    log("updating conversation notes, and compressing memory");
    // [memory] = await internalMonologue(memory, { instructions: "What have I learned?", verb: "noted" })

    const [, updatedNotes] = await conversationNotes(memory, conversationSummary.current, { model: FAST_MODEL })

    conversationSummary.current = updatedNotes as string

    return workingMemory
      .slice(0,1)
      .concat(workingMemory.slice(-4))
  }

  return workingMemory
}

export default summarizesConversation
