"use client";
import Editor from "@/components/Editor";
import Speaking from "@/components/Speaking";
import { SoulConnectorProvider } from "@/hooks/SoulProvider";

export default function Home() {
  return (
    <SoulConnectorProvider>
      <main className="flex min-h-screen flex-row justify-between">
        <div className="w-2/3 h-screen overflow-auto">
          <Editor />
        </div>
        <div className="w-1/3 p-6">
          <Speaking />
        </div>
      </main>
    </SoulConnectorProvider>

  );
}
