export const aiConfig = {
  provider: process.env.AI_PROVIDER ?? "mock",
  model: process.env.OPENAI_MODEL ?? "gpt-5.4-mini",
  deepModel: process.env.OPENAI_DEEP_MODEL ?? "gpt-5.5",
  dailyLimit: Number(process.env.AI_DAILY_LIMIT ?? 20),
} as const

export function assertValidAIConfig() {
  if (process.env.NODE_ENV === "production" && aiConfig.provider === "mock") {
    throw new Error("AI_PROVIDER=mock is not allowed in production.")
  }
}
