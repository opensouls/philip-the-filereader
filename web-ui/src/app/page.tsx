"use client";
import Editor from "@/components/Editor";
import Speaking from "@/components/Speaking";
import Thinking from "@/components/Thinking";
import { SoulConnectorProvider } from "@/hooks/SoulProvider";

export default function Home() {
  return (
    <SoulConnectorProvider>
      <main className="flex min-h-screen flex-row justify-between">
        <div className="w-2/3 h-screen overflow-auto">
          <div className="flex flex-col h-screen p-4">
            <div className="overflow-auto">
              <Editor />
            </div>

          </div>
        </div>
        <div className="w-1/3 p-6">
          <div className="flex flex-col h-screen">
            <div className="h-1/3 overflow-auto pl-3">
              <Speaking />
            </div>
            <div className="h-2/3 overflow-auto pl-3 pt-6">
              <Thinking />
            </div>
          </div>
        </div>
      </main>
    </SoulConnectorProvider>
  );
}
