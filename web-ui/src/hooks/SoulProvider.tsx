"use client";
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Soul } from '@opensouls/soul'
import { v4 as uuidv4 } from 'uuid';

export type SoulOpts = ConstructorParameters<typeof Soul>[0];

const SoulConnectorContext = createContext<Soul | undefined>(undefined);

export const SoulConnectorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const soul = useRef<Soul | undefined>(undefined); // Ref to store the soul
  const needsConnection = useRef(false); // Ref to store if the soul needs to connect
  const [connected, setConnected] = useState<Soul | undefined>(undefined);

  if (!soul.current) {
    console.log("initializaing soul connector")
    const soulId = process.env["NEXT_PUBLIC_SOUL_ID"] || uuidv4();

    soul.current = new Soul({
      soulId,
      blueprint: "philip-the-fileman",
      organization: "tobowers",
      token: process.env["NEXT_PUBLIC_SOUL_ENGINE_API_KEY"]!,
      debug: true,
      local: true,
    });
    needsConnection.current = true;
  }

  useEffect(() => {
    if (!needsConnection.current || !soul.current) {
      return
    }

    needsConnection.current = false;
    console.log("connecting the soul!")
    soul.current.connect().then(() => {
      console.log("connected in SoulConnectorProvider");
      setConnected(soul.current);
    });

    return () => {
      console.log("use effect cleanup called")
    };
  }, []);


  return (
    <SoulConnectorContext.Provider value={connected}>
      {connected && children}
      {!connected && (
        <div className="w-full h-full flex items-center justify-center">
          <div>
            <p>Connecting...</p>
              <p className="text-4xl">Loading...</p>
          </div>
        </div>
      )}
    </SoulConnectorContext.Provider>
  );
};

export const useSoulConnector = () => {
  const context = useContext(SoulConnectorContext);
  if (context === undefined) {
    throw new Error('useSoulConnector must be used within a SoulConnectorProvider');
  }
  return context;
};
