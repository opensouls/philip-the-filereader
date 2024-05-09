import { useSoulConnector } from "@/hooks/SoulProvider";
import CodeBlock from "./CodeBlock"
import { useSyncedStore } from "@syncedstore/react";
import { useEffect, useRef, useState } from "react";
import { observeDeep } from "@syncedstore/core";

const Editor: React.FC = () => {
  const soul = useSoulConnector();
  const store = useSyncedStore(soul.store)
  const processedIdx = useRef(0)

  const [showEditor, setShowEditor] = useState<boolean>(false)

  const [editorCode, setEditorCode] = useState<string>("")
  const [fileName, setFilename] = useState<string>("")
  const [fileList, setFileList] = useState("")
  const [beginEnd, setBeginEnd] = useState<{ begin: number, end: number } | null>(null)
  const [startLine, setStartLine] = useState<number>(0)

  useEffect(() => {
    const stopObserving = observeDeep(store, () => {
      if (store.events?.length <= processedIdx.current) {
        processedIdx.current = 0
        setEditorCode("");
        setFilename("");
        setFileList("");
        setBeginEnd(null);
        setShowEditor(false);
      }
      const evtsToProcess = (store.events || []).slice(processedIdx.current)
      processedIdx.current = store.events?.length || 0

      for (const evt of evtsToProcess) {
        if (evt._metadata?.screen) {
          const lines = (evt._metadata.screen as string).split("\n");
          const firstLineNumber = parseInt(lines[0].match(/^[\d\s]+:/)![0].trim().replace(':', ''), 10);
          setStartLine(firstLineNumber)
          let stripped = lines.map((line) => line.replace(/^[\d\s]+:/, "")).join("\n");
          if (stripped.split("\n").length < 25) {
            stripped += "\n".repeat(22 - stripped.split("\n").length)
          }
          setEditorCode(stripped);
          
          setBeginEnd({ begin: firstLineNumber, end: firstLineNumber });
          setShowEditor(true)
          setBeginEnd(null)
        }
        if (evt._metadata?.cwd) {
          setFilename(`${evt._metadata.cwd || ""}/${evt._metadata.fileName || ""}`)
        }

        if (evt._metadata?.list) {
          setShowEditor(false)
          setFileList(evt.content)
          setBeginEnd(null)
        }

        if (evt.action === "startsEditing") {
          setBeginEnd({ begin: evt._metadata?.start as number, end: evt._metadata?.end as number })
        }
      }
    })

    return () => {
      stopObserving()
    }
  }, [store])

  if (showEditor) {
    return (
      <div className="pb-4">
        <p>{fileName}</p>
        <CodeBlock lang={fileName.endsWith("md") ? "markdown" : "typescript"} highlightStart={beginEnd?.begin} highlightEnd={beginEnd?.end} startingLine={startLine} >
          {editorCode}
        </CodeBlock>
      </div>
    )
  }

  return (
    <div>
      <p className="mb-6">Listing: {fileName}</p>
      <pre>
        {fileList}
      </pre>
    </div>

  )


}

export default Editor