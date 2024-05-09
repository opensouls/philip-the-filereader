import { useSoulConnector } from "@/hooks/SoulProvider";
import CodeBlock from "./CodeBlock"
import { useSyncedStore } from "@syncedstore/react";
import { useEffect, useRef, useState } from "react";
import { observeDeep } from "@syncedstore/core";

const Editor: React.FC = () => {
  const soul = useSoulConnector();
  const store = useSyncedStore(soul.store)
  const processedIdx = useRef(0)

  const [editorCode, setEditorCode] = useState<string>("")
  const [fileName, setFilename] = useState<string>("")

  useEffect(() => {
    const stopObserving = observeDeep(store, () => {
      const evtsToProcess = (store.events || []).slice(processedIdx.current)
      processedIdx.current = store.events?.length || 0

      for (const evt of evtsToProcess) {
        if (evt._metadata?.screen) {
          const stripped = (evt._metadata.screen as string).split("\n").map((line) => line.replace(/^[\d\s]+:/, "")).join("\n")
          setEditorCode(stripped)
        }
        if (evt._metadata?.fileName) {
          setFilename(`${evt._metadata.cwd}/${evt._metadata.fileName}`)
        }
      }
    })

    return () => {
      stopObserving()
    }
  }, [store])


  return (
    <>
      <p>{fileName}</p>
      <CodeBlock lang="typescript" >
        {editorCode}
      </CodeBlock>
    </>
  )
}

export default Editor