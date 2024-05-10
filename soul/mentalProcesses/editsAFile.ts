
import { MentalProcess, indentNicely, useActions, createCognitiveStep, WorkingMemory, ChatMessageRoleEnum, useSoulMemory} from "@opensouls/engine";
import readsAFile from "./readsAFile.js";
import instruction from "../cognitiveSteps/instruction.js";
import { BIG_MODEL, FAST_MODEL } from "../lib/models.js";
import { removeScreens } from "../lib/removeScreens.js";

const codeInstruction = createCognitiveStep((instructions: string) => {
  return {
    command: ({ soulName }: WorkingMemory) => {
      return {
        role: ChatMessageRoleEnum.System,
        name: soulName,
        content: instructions,
      };
    },
    postProcess: (workingMemory, code ) => {
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

const editsAFile: MentalProcess<{start: number, end: number, screen: string, commentary: string, cwd: string, fileName: string }> = async ({ workingMemory, params }) => {
  const { log, dispatch  } = useActions()
  const lastEdit = useSoulMemory('lastEdit', { start: 0, end: 0 })

  // let's stop him from looping for now - there's probably a better way.
  if (lastEdit.current.start === params.start && lastEdit.current.end === params.end) {
    workingMemory = workingMemory.withMonologue("Philip thinks: On second thought, I'm happy with those lines as is.")
    return [workingMemory, readsAFile, { executeNow: true }]
  }

  lastEdit.current.start = params.start
  lastEdit.current.end = params.end

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
  const cleanMemory = workingMemory.slice(0,1)
  
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

  const [, summary] = await instruction(
    withCode,
    indentNicely`
      Summarize the edit Philip just made from lines ${params.start} to ${params.end} in the file. Reply in the voice of Philip and in only 1-2 sentences.
    `,
    { model: FAST_MODEL }
  );

  log("summary", summary)

  const summarizedMemory = removeScreens(workingMemory).withMonologue(indentNicely`
    Philip just edited lines ${params.start} to ${params.end} of '${params.cwd}/${params.fileName}' in his editor.
    ## Philip's summary of changes
    > ${summary}
  `)

  return [summarizedMemory, readsAFile]
}

export default editsAFile
