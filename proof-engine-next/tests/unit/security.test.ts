import { describe, expect, it } from "vitest"
import { decryptSecret, encryptSecret } from "@/lib/security/encryption"
import { signWebhookPayload, verifyWebhookPayload } from "@/lib/security/webhook"

describe("security helpers", () => {
  it("encrypts and decrypts connector secrets", () => {
    const encrypted = encryptSecret({ token: "secret-token" })
    expect(encrypted.encryptedPayload).not.toContain("secret-token")
    expect(decryptSecret<{ token: string }>(encrypted.encryptedPayload)).toEqual({ token: "secret-token" })
  })

  it("verifies signed ingestion payloads", () => {
    const body = JSON.stringify({ eventName: "guest_joined" })
    const signature = signWebhookPayload(body)
    const result = verifyWebhookPayload({
      body,
      projectKey: "demo-project-key",
      signature,
    })

    expect(result.ok).toBe(true)
  })
})
