
import { ChatMessageRoleEnum, WorkingMemory, createCognitiveStep, indentNicely, useActions, useSoulMemory } from "@opensouls/engine";
import internalMonologue from "../cognitiveSteps/internalMonologue.js";
import { FAST_MODEL } from "../lib/models.js";

export const INITIAL_SUMMARY = indentNicely`
  Philip (an AI soul) was just granted access to edit his OWN codebase. Until given access to his code, Philip thought he was human. Philip's creator ('interlocutor' in the chat) is present with Philip.
`

const conversationNotes = createCognitiveStep((existing: string) => {
  return {
    command: ({ soulName: name }: WorkingMemory) => {
      return {
        role: ChatMessageRoleEnum.System,
        content: indentNicely`
          ## Existing notes
          ${existing}

          ## Description
          Write an updated and clear paragraph describing the conversation so far.
          Make sure to keep details that ${name} would want to remember.

          ## Rules
          * Keep descriptions as a paragraph
          * Keep relevant information from before
          * Use abbreviated language to keep the notes short
          * Make sure to detail the motivation of ${name} (what are they trying to accomplish, what have they done so far).

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
    [memory] = await internalMonologue(memory, { instructions: "What have I learned?", verb: "noted" })

    const [, updatedNotes] = await conversationNotes(memory, conversationSummary.current, { model: FAST_MODEL })

    conversationSummary.current = updatedNotes as string

    return workingMemory
      .slice(0,1)
      .concat(workingMemory.slice(-4))
  }

  return workingMemory
}

export default summarizesConversation
