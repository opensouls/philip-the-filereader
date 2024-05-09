import { useSoulConnector } from "@/hooks/SoulProvider";
import { useSyncedStore } from "@syncedstore/react";
import { useEffect, useRef, useState } from "react";
import { observeDeep } from "@syncedstore/core";
import { SoulEvent } from "@opensouls/core";

const Speech: React.FC<{mem: SoulEvent, embiggen: boolean}> = ({ mem, embiggen }) => {
  return (
    <div className={embiggen ? "text-2xl mb-8" : "text-xs mb-4"}>
      <p>{mem.content}</p>
    </div>
  )
}

const Thought: React.FC<{mem: SoulEvent}> = ({mem}) => {
  return (
    <div className="text-xs text-[rgb(101,163,13)] mb-4">
      <p>{mem.content}</p>
    </div>
  )
}

const Speaking: React.FC = () => {
  const soul = useSoulConnector();
  const store = useSyncedStore(soul.store)

  const [speechMessages, setSpeechMessages] = useState<SoulEvent[]>([])
  const [nonSpeechMessages, setNonSpeechMessages] = useState<SoulEvent[]>([])

  useEffect(() => {
    const stopObserving = observeDeep(store, () => {
      setSpeechMessages((store.events || []).filter((mem) => {
        return mem.action === "says"
      }).reverse())

      setNonSpeechMessages((store.events || []).filter((mem) => {
        return mem.action !== "says"
      }).reverse())
    })

    return () => {
      stopObserving()
    }
  }, [store])


  return (
    <div className="flex flex-col h-screen space-y-6">
      <div className="h-1/2 overflow-auto">
        {speechMessages.map((mem, idx) => {
          return <Speech key={mem._id} mem={mem} embiggen={idx === 0} />
        })}
      </div>
      <hr />
      <div className="h-1/2 overflow-auto">
        <h2 className="mb-4">Philip&apos;s Mind</h2>
        {nonSpeechMessages.map((mem, idx) => {
          return <Thought key={mem._id} mem={mem} />
        })}
      </div>
    </div>
  )
}

export default Speaking
