import { ChatMessageRoleEnum, WorkingMemory, createCognitiveStep, indentNicely, useActions, useSoulMemory, z } from "@opensouls/engine";
import decision from "../cognitiveSteps/decision.js";
import { BIG_MODEL } from "../lib/models.js";
import { INITIAL_GOAL } from "../lib/initialStates.js";

export interface ToolDescription {
  description: string
  params?: z.ZodObject<any>
}

export type ToolPossibilities = Record<string, ToolDescription>


const chooseTool = createCognitiveStep(({ choices, goal }: { goal: string, choices: ToolPossibilities }) => {
  const params = z.object({
    decision: z.nativeEnum(Object.keys(choices) as unknown as z.EnumLike).describe(`The name of the tool chosen.`)
  });

  return {
    schema: params,
    command: (workingMemory: WorkingMemory) => {
      const name = workingMemory.soulName

      const toolStrings = Object.entries(choices).map(([key, value]) => indentNicely`
        <tool name="${key}">
          ${value.description}
        </tool>
      `).concat([
        indentNicely`
          <tool name="none">
            Do nothing, keep going.
          </tool>
        `
      ])

      return {
        role: ChatMessageRoleEnum.System,
        name: name,
        content: indentNicely`
          ## ${workingMemory.soulName} chooses a tool
        
          ### Goal
          ${goal}
        
          ### Tools
          ${workingMemory.soulName} is trying to make progress on their goal. They have a few tools at their disposal:
          ${toolStrings.join("\n")}
          
          ${workingMemory.soulName} decides which tool to use.
          If ${workingMemory.soulName} does not want to use any of those tools, then choose "none".
        `
      };
    },
    postProcess: async (memory: WorkingMemory, response: z.infer<typeof params>) => {
      const newMemory = {
        role: ChatMessageRoleEnum.Assistant,
        content: `${memory.soulName} chose the tool: "${response.decision.toString()}"`
      };
      return [newMemory, response.decision.toString()];
    }
  }
});


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
  const [, toolChoice] = await chooseTool(
    workingMemory,
    { goal: goal.current, choices: possibilities },
    { model: BIG_MODEL }
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

          Please decide on the arguments to use when calling the tool.
        `,
        schema: possibilities[toolChoice].params,
      }
    });

    [, args] = await func(workingMemory, undefined, { model: BIG_MODEL })

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
