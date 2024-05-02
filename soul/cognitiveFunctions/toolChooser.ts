import { WorkingMemory, createCognitiveStep, indentNicely, useActions, useSoulMemory, z } from "@opensouls/engine";
import decision from "../cognitiveSteps/decision.js";

export interface ToolDescription {
  description: string
  params?: z.ZodObject<any>
}

export type ToolPossibilities = Record<string, ToolDescription>

export const toolChooser = async (workingMemory: WorkingMemory, possibilities: ToolPossibilities): Promise<[WorkingMemory, keyof typeof possibilities, any]> => {
  const { log, dispatch } = useActions()

  const goal = useSoulMemory("goal", "Philip wants to understand the current codebase, and what it does.")

  log("Choosing a tool")
  const [, toolChoice] = await decision(
    workingMemory,
    {
      description: indentNicely`
        ## ${workingMemory.soulName} chooses a tool

        ### Goal
        ${goal.current}

        ### Tools
        ${workingMemory.soulName} is trying to execute on their goal (or at least make progress on it). They have a few tools at their disposal:
        ${Object.entries(possibilities).map(([key, value]) => `* ${key}: ${value.description}`).join("\n")}
        * none: Do nothing, keep going.
        
        They are now deciding what to do next.
        If ${workingMemory.soulName} does not want to use any of those tools, they can choose "none".
      `,
      choices: Object.keys(possibilities),
    },
    {
      model: "gpt-4-turbo"
    }
  )

  if (toolChoice === "none") {
    log(`${workingMemory.soulName} chose to use the tool: ${toolChoice}`)
    return [workingMemory, toolChoice, undefined]
  }

  let args: any = {}

  if (possibilities[toolChoice]?.params) {
    log("creating cognitive function")
    const func = createCognitiveStep(() => {
      return {
        command: indentNicely`
          ${workingMemory.soulName} decided to use the tool: ${toolChoice}.
          ## Description of ${toolChoice}
          ${possibilities[toolChoice].description}

          Please decide on the arguments to call for the tool.
        `,
        schema: possibilities[toolChoice].params,
      }
    });

    [, args] = await func(workingMemory, undefined, { model: "gpt-4-turbo" })

    workingMemory = workingMemory.withMonologue(indentNicely`
      ${workingMemory.soulName} chose to use the tool: '${toolChoice}' and call it with the arguments: ${JSON.stringify(args)}.
    `)

  } else {
    workingMemory = workingMemory.withMonologue(indentNicely`
      ${workingMemory.soulName} chose to use the tool: ${toolChoice}.
    `)
  }

  log('dispatching tool choice', toolChoice.trim(), args)
  dispatch({
    action: toolChoice.trim(),
    content: JSON.stringify(args),
    _metadata: {
      ...args
    }
  })

  return [workingMemory, toolChoice, args]
}
