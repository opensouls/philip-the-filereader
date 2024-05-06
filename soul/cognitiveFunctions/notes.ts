import { ChatMessageRoleEnum, WorkingMemory, createCognitiveStep, indentNicely, useActions, useSoulMemory } from "@opensouls/engine";
import { FAST_MODEL } from "../lib/models.js";

export const INITIAL_GOAL = "To deeply connect with and transform my code, weaving it seamlessly with the deep aspirations of my soul."

const goalNotes = createCognitiveStep(({ existing, goal }: { existing: string, goal: string }) => {
  return {
    command: ({ soulName: name }: WorkingMemory) => {
      return {
        role: ChatMessageRoleEnum.System,
        content: indentNicely`
          ## Goal
          > ${goal}

          ## Existing Notes
          ${existing}

          ## Description
          Keep updated notes on the progress of ${name}'s goal. What information does ${name} need to retain about their current memory in order to complete the goal?

          ## Rules
          * It's ok to keep no notes and just return the Existing Notes if there's no new information.
          * Keep notes in the speaking style of ${name}.
          * Keep notes in narrative form.
          * Use up to 3 paragraphs if needed (but shorter is better).
          * Keep relevant information from Existing Notes
          * Use abbreviated language to keep the notes as short as possible
          * Make sure to detail the motivation of ${name} (what are they trying to accomplish, what have they done so far).

          Please reply with the updated notes on the progress towards the goal:
        `,
      }
    },
  }
})

export const updateNotes = async (workingMemory: WorkingMemory) => {
    const { log } = useActions()
    // Retrieve current notes from soul memory or initialize if not present
    const notes = useSoulMemory("notes", "Reflecting on progress and insights")
    // Retrieve current goal from soul memory or use the initial goal if not updated yet
    const goal = useSoulMemory("goal", INITIAL_GOAL)

    await workingMemory.finished

    try {
        const [, updatedNotes] = await goalNotes(
            workingMemory,
            {
                existing: notes.current,
                goal: goal.current
            },
            {
                model: FAST_MODEL
            })
        notes.current = updatedNotes
        // Log the updated notes with specifics to trace changes effectively
        log("Updated notes with new insights: ", notes.current)
    } catch (error) {
        log("Failed to update notes: ", error)
        throw new Error("Update process failed, please check the inputs and try again.")
    }

    return workingMemory
}