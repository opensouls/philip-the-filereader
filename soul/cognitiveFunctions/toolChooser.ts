import { WorkingMemory, createCognitiveStep, indentNicely, useActions, useSoulMemory, z } from "@opensouls/engine";
import decision from "../cognitiveSteps/decision.js";
import { INITIAL_GOAL } from "./notes.js";

export interface ToolDescription {
  description: string
  params?: z.ZodObject<any>
}

export type ToolPossibilities = Record<string, ToolDescription>

/**
 * Allows a soul to choose from a list of available tools or opt to not use any tool.
 * This function presents the soul with a description of each tool and the current goal,
 * then awaits a decision on which tool to use. If the soul decides not to use any tool,
 * the function will return with the choice "none".
 * 
 * The soul will dispach the tool choice.
 */
export const toolChooser = async (workingMemory: WorkingMemory, possibilities: ToolPossibilities): Promise<[WorkingMemory, keyof typeof possibilities, any]> => {
  const { log, dispatch } = useActions()

  const goal = useSoulMemory("goal", INITIAL_GOAL)

  log("Choosing a tool")
  // first just decide which tool to us.
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

  // then if the user has specified an argument format
  // then get the actual arguments to the tool as a separate step.
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
