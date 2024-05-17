import { SoulSupport } from "../src/SoulSupport.js";

const support = new SoulSupport()

await support.start()

await new Promise<void>(resolve => { setTimeout(resolve, 2_000) })

console.log(`
=====================
Visit https://souls.chat/chats/${process.env.SOUL_ENGINE_ORG}/philip-the-fileman/reader2 to get started.
=====================
`)
