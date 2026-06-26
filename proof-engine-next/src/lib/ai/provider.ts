import { aiConfig, assertValidAIConfig } from "@/config/ai"
import { MockAIProvider, type AIProvider } from "@/lib/ai/providers/mock"
import { OpenAIProvider } from "@/lib/ai/providers/openai"

export function getAIProvider(): AIProvider {
  assertValidAIConfig()

  if (aiConfig.provider === "openai") {
    return new OpenAIProvider()
  }

  if (aiConfig.provider === "mock") {
    return new MockAIProvider()
  }

  throw new Error(`AI_PROVIDER inconnu: ${aiConfig.provider}`)
}
