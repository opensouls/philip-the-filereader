"use client";
import Editor from "@/components/Editor";
import Speaking from "@/components/Speaking";
import { SoulConnectorProvider } from "@/hooks/SoulProvider";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-row justify-between p-24">
      <SoulConnectorProvider>
        <div className="w-1/2">
          <Editor />
        </div>
        <div className="w-1/2 p-6">
          <Speaking />
        </div>
      </SoulConnectorProvider>
    </main>
  );
}
