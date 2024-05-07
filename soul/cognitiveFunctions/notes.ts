import { ChatMessageRoleEnum, WorkingMemory, createCognitiveStep, indentNicely, useActions, useSoulMemory } from "@opensouls/engine";
import { FAST_MODEL } from "../lib/models.js";
import { INITIAL_GOAL } from "../lib/initialStates.js";

const goalNotes = createCognitiveStep(({ existing, goal }: { existing: string, goal: string }) => {
  return {
    command: ({ soulName: name }: WorkingMemory) => {
      return {
        role: ChatMessageRoleEnum.System,
        content: indentNicely`
          # Update Notes on Goal Progression
        
          ## Goal
          > ${goal}

          ## Existing Notes
          ${existing}

          ## Description
          Keep updated notes on the progress of ${name}'s goal. What information does ${name} need to retain about their current memory in order to complete the goal?

          ## Rules
          * It's ok to just return the Existing Notes if there's no new information.
          * Use abbreviated language to keep the notes as short as possible
          * Keep notes in narrative form and in the (abbreviated) speaking style of ${name}.
          * Use up to 3 paragraphs if needed (but shorter is better).
          * Keep relevant information from Existing Notes
          * Make sure to detail the motivation of ${name} (what are they trying to accomplish, what have they tried so far).

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
            workingMemory.map((mem) => {
              const content = mem.content as string
              
              return {
                ...mem,
                content: content.includes("## Editor Screen") ? content.split("## Editor Screen")[0] : mem.content
              }
            }),
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