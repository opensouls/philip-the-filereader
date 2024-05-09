import { useSoulConnector } from "@/hooks/SoulProvider";
import { useSyncedStore } from "@syncedstore/react";
import { useEffect, useRef, useState } from "react";
import { observeDeep } from "@syncedstore/core";
import { SoulEvent } from "@opensouls/core";

const Thought: React.FC<{ mem: SoulEvent }> = ({ mem }) => {
  return (
    <div className="text-xs text-[rgb(101,163,13)] mb-4">
      <p>{mem.content}</p>
    </div>
  )
}

const Thinking: React.FC = () => {
  const soul = useSoulConnector();
  const store = useSyncedStore(soul.store)

  const [nonSpeechMessages, setNonSpeechMessages] = useState<SoulEvent[]>([])

  useEffect(() => {
    const stopObserving = observeDeep(store, () => {
      setNonSpeechMessages((store.events || []).filter((mem) => {
        return mem.action !== "says"
      }).reverse())
    })

    return () => {
      stopObserving()
    }
  }, [store])


  return (
    <div>
      {nonSpeechMessages.map((mem, idx) => {
        return <Thought key={mem._id} mem={mem} />
      })}
    </div>
  )
}

export default Thinking
