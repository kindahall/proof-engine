import type { GatewayProvider } from "@/lib/gateway/types"

export class PreparedGatewayProvider implements GatewayProvider {
  private readonly label: string

  constructor(label: string) {
    this.label = label
  }

  async testConnection() {
    return {
      ok: false,
      status: "blocked" as const,
      latencyMs: 24,
      message: `${this.label} est structure dans le backend, mais son transport n'est pas encore cable. Utilisez un Gateway HTTP pour une synchronisation reelle.`,
      capabilities: [],
      forbiddenCapabilities: [],
    }
  }

  async listCapabilities() {
    return []
  }

  async inspectSchema(): Promise<never> {
    throw new Error(this.unavailableMessage())
  }

  async readEvents(): Promise<never> {
    throw new Error(this.unavailableMessage())
  }

  async readEntities(): Promise<never> {
    throw new Error(this.unavailableMessage())
  }

  async readMetrics(): Promise<never> {
    throw new Error(this.unavailableMessage())
  }

  private unavailableMessage() {
    return `${this.label} n'a pas de transport read-only implemente. Aucun evenement mock ne sera renvoye.`
  }
}
