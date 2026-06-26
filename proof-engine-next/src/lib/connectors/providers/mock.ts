import { getSampleFixtureEvents } from "@/lib/connectors/fixtures/sample-events"

export class MockConnectorProvider {
  async testConnection() {
    return {
      ok: true,
      status: "healthy" as const,
      latencyMs: 12,
      message: "Connecteur mock interne disponible en lecture seule.",
    }
  }

  async readEvents() {
    return getSampleFixtureEvents()
  }
}
