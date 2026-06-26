export const marketingAnalyticsConfig = {
  segmentWriteKey: process.env.NEXT_PUBLIC_SEGMENT_WRITE_KEY ?? "",
  enabled:
    process.env.NEXT_PUBLIC_ANALYTICS_ENABLED !== "false" &&
    Boolean(process.env.NEXT_PUBLIC_SEGMENT_WRITE_KEY),
  runtimeMode: process.env.NEXT_PUBLIC_PROOF_ENGINE_RUNTIME ?? "local",
} as const
