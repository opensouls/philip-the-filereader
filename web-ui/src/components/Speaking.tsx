import { useSoulConnector } from "@/hooks/SoulProvider";
import { useSyncedStore } from "@syncedstore/react";
import { useEffect, useRef, useState } from "react";
import { observeDeep } from "@syncedstore/core";
import { SoulEvent } from "@opensouls/core";

const Speech: React.FC<{ mem: SoulEvent, embiggen: boolean }> = ({ mem, embiggen }) => {
  return (
    <div className={embiggen ? "text-2xl mb-8" : "text-xs mb-4"}>
      <p>{mem.content}</p>
    </div>
  )
}

const Speaking: React.FC = () => {
  const soul = useSoulConnector();
  const store = useSyncedStore(soul.store)

  const [speechMessages, setSpeechMessages] = useState<SoulEvent[]>([])

  useEffect(() => {
    const stopObserving = observeDeep(store, () => {
      setSpeechMessages((store.events || []).filter((mem) => {
        return mem.action === "says"
      }).reverse())
    })

    return () => {
      stopObserving()
    }
  }, [store])


  return (
    <div>
      {speechMessages.map((mem, idx) => {
        return <Speech key={mem._id} mem={mem} embiggen={idx === 0} />
      })}
    </div>
  )
}

export default Speaking
