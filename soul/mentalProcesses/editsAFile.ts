
import { MentalProcess, indentNicely, useActions } from "@opensouls/engine";
import readsAFile from "./readsAFile.js";
import instruction from "../cognitiveSteps/instruction.js";

const editsAFile: MentalProcess<{start: number, end: number, screen: string, commentary: string }> = async ({ workingMemory, params }) => {
  const { log, dispatch  } = useActions()

  // ok so first, let's have a think on what philip really wants to edit and why
  const [, withEditLogic] = await instruction(
    workingMemory,
    indentNicely`
      Philip has a file open in the editor:

      ${params.screen}

      <hr />

      Philip has decided to edit lines ${params.start} to ${params.end}. His reasoning so far is:
      > ${params.commentary}

      Please reply in detail as to the text/code changes Philip wants to make (to those line numbers) and *why* he would like to make them.
    `,
    { model: "gpt-4-turbo" }
  );

  log("ok, here are the changes", withEditLogic)

  // next we'll work with a very clean working memory (just the system prompt)
  const cleanMemory = workingMemory.slice(0,1)
  
  const [withCode, onlyCode] = await instruction(
    cleanMemory,
    indentNicely`
      Philip has decided to edit lines ${params.start} to ${params.end}.

      ## Code Screen From the Open Editor

      ${params.screen}

      ## Changes To Make
      ${withEditLogic}

      ## Rules
      * Do not include any additional commentary (if you must make a comment, wrap it in a code comment).
      * Do not include any line numbers (The line numbers from the Code Screen From Open Editor section are only there because they are from the text editor).
      * Provide complete code, the code/text you return will *completely* replace any code/text in lines ${params.start} to ${params.end}.

      Please reply with *only* the text/code replacing lines ${params.start} through ${params.end}.
    `,
    { model: "quality" }
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
    `
  );

  log("summary", summary)

  const summarizedMemory = workingMemory.withMonologue(indentNicely`
    Philip just made the following edit to the file:
    > ${summary}
  `)

  return [summarizedMemory, readsAFile]
}

export default editsAFile
