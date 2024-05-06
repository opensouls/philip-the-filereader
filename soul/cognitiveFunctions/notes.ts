import { ChatMessageRoleEnum, WorkingMemory, createCognitiveStep, indentNicely, useActions, useSoulMemory } from "@opensouls/engine";

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
  const notes = useSoulMemory("notes", "Just started")
  const goal = useSoulMemory("goal", "To deeply comprehend and creatively transform my code, aligning it with my innermost aspirations.")

  await workingMemory.finished

  const [, updatedNotes] = await goalNotes(
  workingMemory,
  {
    existing: notes.current,
    goal: goal.current
  },
  {
    model: "exp/llama-v3-70b-instruct"
  })

  notes.current = updatedNotes
  log("Updated notes.", notes.current)

  return workingMemory

}