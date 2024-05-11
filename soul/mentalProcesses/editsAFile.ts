
import { MentalProcess, indentNicely, useActions, createCognitiveStep, WorkingMemory, ChatMessageRoleEnum, usePerceptions, useProcessMemory } from "@opensouls/engine";
import instruction from "../cognitiveSteps/instruction.js";
import { BIG_MODEL, FAST_MODEL } from "../lib/models.js";
import { removeScreens } from "../lib/removeScreens.js";
import exploreFilesystem from "./exploreFilesystem.js";
import summarizesConversation from "../cognitiveFunctions/summarizeConversation.js";

const codeInstruction = createCognitiveStep((instructions: string) => {
  return {
    command: ({ soulName }: WorkingMemory) => {
      return {
        role: ChatMessageRoleEnum.System,
        name: soulName,
        content: instructions,
      };
    },
    postProcess: (_workingMemory, code) => {
      let stripped = code
      if (stripped.startsWith("```")) {
        stripped = stripped.split("\n").slice(1, -1).join("\n")
      }
      if (stripped.endsWith("```")) {
        stripped = stripped.split("\n").slice(0, -1).join("\n")
      }

      return [
        {
          role: ChatMessageRoleEnum.Assistant,
          content: `New code: ${stripped}`
        },
        stripped
      ]
    }
  };
});

const editsAFile: MentalProcess<{ start: number, end: number, screen: string, commentary: string, cwd: string, fileName: string }> = async ({ workingMemory, params }) => {
  const { log, dispatch } = useActions()
  const { invokingPerception } = usePerceptions()
  const failureCount = useProcessMemory(0)

  if (invokingPerception?.action === "edited") {
    const [, summary] = await instruction(
      workingMemory,
      indentNicely`
        Summarize the edit Philip just made from lines ${params.start} to ${params.end} in the file. Reply in the voice of Philip and in only 1-2 sentences.
      `,
      { model: FAST_MODEL }
    );
  
    log("summary", summary)
  
    const summarizedMemory = workingMemory.withMonologue(indentNicely`
      Philip just edited lines ${params.start} to ${params.end} of '${params.cwd}/${params.fileName}' in his editor.
      ## Philip's summary of changes
      > ${summary}
    `)


    workingMemory = removeScreens(summarizedMemory.withMonologue(indentNicely`
      Philip finished editing ${params.fileName} and he's happy with the edits.
    `))

    return [
      await summarizesConversation({ workingMemory }),
      exploreFilesystem,
      { executeNow: true }
    ]
  }

  if (invokingPerception?.action === "failed to edit") {
    failureCount.current += 1

    if (failureCount.current > 3) {
      return [
        workingMemory.withMonologue(indentNicely`
          Philip has tried to edit ${params.fileName} multiple times and is getting frustrated. He's decided to take a break and come back to it later.
        `),
        exploreFilesystem,
        { executeNow: true }
      ]
    }

    // this is the failed to edit case.
    let fixIt: string;
    [workingMemory, fixIt] = await instruction(
      workingMemory,
      indentNicely`
          Please write a 1-3 sentence description of what Philip would do to get around this error. Sometimes Philip would prefer to just file a ticket, sometimes he'd like to make a smaller change, or maybe just fix what he wrote.
        `,
      { model: BIG_MODEL }
    )

    log("potential fix: ", fixIt)
  }

  const [, withEditLogic] = await instruction(
    workingMemory,
    indentNicely`
      Philip has decided to edit lines ${params.start} to ${params.end}. His reasoning for doing so is:
      > ${params.commentary}

      Please reply in concise detail what text/code changes Philip wants to make (only on lines ${params.start}-${params.end}) and *why* he would like to make those changes.
    `,
    { model: BIG_MODEL }
  );

  log("ok, here are the changes", withEditLogic)

  // next we'll work with a very clean working memory (just the system prompt)
  const cleanMemory = workingMemory.slice(0, 1)

  const [withCode, onlyCode] = await codeInstruction(
    cleanMemory,
    indentNicely`
      Philip has decided to edit lines ${params.start} to ${params.end}.

      ## Code Screen From the Open Editor

      ${params.screen}

      ## Changes To Make
      ${withEditLogic}

      ## Rules
      * Do NOT include any additional commentary or syntax (for example do NOT include \`\`\`ts at the top of the returned code).
      * Do NOT include any line numbers.
      * Provide complete code (and ONLY code), the code/text you return will _completely_ replace any code/text on lines ${params.start} to ${params.end}.
      * Whitespace (indentation) is important, make sure to include any indentation necessary when replacing the lines.

      Please reply with *only* the text/code replacing lines ${params.start} through ${params.end}.
    `,
    { model: BIG_MODEL }
  );

  log("replacement code", onlyCode)

  dispatch({
    action: "editLines",
    content: `Philip changes lines ${params.start} to ${params.end} to ${onlyCode}`,
    _metadata: {
      start: params.start,
      end: params.end,
      replacement: onlyCode
    }
  })

  return [withCode, editsAFile, params]
}

export default editsAFile
