import { afterEach, describe, expect, it, vi } from "vitest"

const validPayload = {
  name: "Camille Martin",
  email: "camille@example.com",
  message: "Bonjour, je voudrais parler du plan Scale pour Proof Engine.",
  source: "marketing_contact_form",
}

function contactRequest(body: unknown) {
  return new Request("http://proof-engine.local/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

async function loadContactRoute() {
  vi.resetModules()
  return import("@/app/api/contact/route")
}

describe("contact API", () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it("rejects invalid contact payloads", async () => {
    const { POST } = await loadContactRoute()

    const response = await POST(contactRequest({ ...validPayload, message: "court" }))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({ ok: false, error: "invalid_payload" })
  })

  it("does not pretend to send when no contact webhook is configured", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined)
    const { POST } = await loadContactRoute()

    const response = await POST(contactRequest(validPayload))
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body).toMatchObject({ ok: false, error: "contact_not_configured" })
    expect(body.mailto).toContain("mailto:hello@proofengine.app")
  })

  it("forwards contact messages to the configured server webhook", async () => {
    vi.stubEnv("CONTACT_WEBHOOK_URL", "https://hooks.example.com/contact")
    vi.stubEnv("CONTACT_WEBHOOK_SECRET", "server-only-secret")
    vi.spyOn(console, "info").mockImplementation(() => undefined)
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }))
    vi.stubGlobal("fetch", fetchMock)
    const { POST } = await loadContactRoute()

    const response = await POST(contactRequest(validPayload))

    expect(response.status).toBe(202)
    await expect(response.json()).resolves.toMatchObject({ ok: true })
    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe("https://hooks.example.com/contact")
    expect(init.method).toBe("POST")
    expect(init.headers).toMatchObject({
      "Content-Type": "application/json",
      Authorization: "Bearer server-only-secret",
    })
    expect(JSON.parse(String(init.body))).toMatchObject({
      name: validPayload.name,
      email: validPayload.email,
      message: validPayload.message,
      source: "marketing_contact_form",
    })
  })

  it("returns a delivery error when the webhook rejects the message", async () => {
    vi.stubEnv("CONTACT_WEBHOOK_URL", "https://hooks.example.com/contact")
    vi.spyOn(console, "warn").mockImplementation(() => undefined)
    vi.stubGlobal("fetch", vi.fn(async () => new Response("no", { status: 500 })))
    const { POST } = await loadContactRoute()

    const response = await POST(contactRequest(validPayload))

    expect(response.status).toBe(502)
    await expect(response.json()).resolves.toMatchObject({ ok: false, error: "contact_delivery_failed" })
  })
})
