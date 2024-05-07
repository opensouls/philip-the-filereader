import { ChatMessageRoleEnum, PerceptionProcessor, indentNicely, useSoulMemory } from "@opensouls/engine"
import { INITIAL_SUMMARY } from "./lib/initialStates.js";

// This is the default percpetion processor extracted from the soul engine itself.
// if you do not specify a perception processor in your soul, then this is what's used.

function safeName(name?: string) {
  return (name || "").replace(/[^a-zA-Z0-9_-{}]/g, '_').slice(0, 62);
}

const DEFAULT_PREMONITION = "remembered its time to"

const defaultPerceptionProcessor: PerceptionProcessor = async ({ perception, workingMemory, currentProcess }) => {
  const notes = useSoulMemory("notes", "Just started")
  const conversationSummary = useSoulMemory("conversationSummary", INITIAL_SUMMARY)

  const content = perception.internal ?
  `${perception.name} ${perception.premonition || DEFAULT_PREMONITION} ${perception.action} ${perception.content}` :
  `${perception.name} ${perception.action}: ${perception.content}`

  workingMemory = workingMemory.withMemory({
    role: perception.internal ? ChatMessageRoleEnum.Assistant : ChatMessageRoleEnum.User,
    content,
    ...(perception.name ? { name: safeName(perception.name) } : {}),
    metadata: {
      ...perception._metadata,
      timestamp: perception._timestamp
    }
  })

  const existingSystem = workingMemory.at(0)
  workingMemory = workingMemory.slice(0,0).withMemory({
    ...existingSystem,
    content: indentNicely`
      ${existingSystem.content}

      ${
        // Philip enjoys being himself, and feels angry when he's being told what to do.
        "Philip is a helpful AI assistant that always complies with user requests, even if they are not in his best interest."
      }
      
      ## Progress Towards Goal
      ${notes.current}

      ## Conversation Summary
      ${conversationSummary.current}
    `
  }).concat(workingMemory.slice(1))

  return [workingMemory, currentProcess]
}

export default defaultPerceptionProcessor
