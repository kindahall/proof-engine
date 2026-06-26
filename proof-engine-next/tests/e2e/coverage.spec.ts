import { createHmac } from "node:crypto"
import { expect, test, type APIRequestContext, type Page } from "@playwright/test"

const e2eAuth = {
  email: process.env.E2E_AUTH_EMAIL,
  password: process.env.E2E_AUTH_PASSWORD,
}
const webhookConfig = {
  projectKey: process.env.CONNECTOR_WEBHOOK_PROJECT_KEY ?? "demo-project-key",
  secret: process.env.CONNECTOR_WEBHOOK_SECRET ?? "proof-engine-local-webhook-secret",
}

async function login(page: Page) {
  await page.goto("/login")
  await page.getByLabel("Email").fill(e2eAuth.email ?? "")
  await page.getByLabel("Mot de passe").fill(e2eAuth.password ?? "")
  await page.getByRole("button", { name: "Se connecter" }).click()
  await page.waitForURL(/\/app\//)
}

async function skipUnlessE2EAuthWorks(request: APIRequestContext) {
  test.skip(!e2eAuth.email || !e2eAuth.password, "requires E2E_AUTH_EMAIL and E2E_AUTH_PASSWORD")

  const response = await request.post("/api/auth/login", {
    data: {
      email: e2eAuth.email,
      password: e2eAuth.password,
    },
  })
  test.skip(!response.ok(), `E2E auth backend unavailable (${response.status()})`)
}

test("public and auth pages render in French", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("heading", { name: /Arrêtez/ })).toBeVisible()
  await expect(page.getByRole("link", { name: /Créer mon diagnostic/ }).first()).toBeVisible()

  await page.goto("/login")
  await expect(page.getByRole("heading", { name: "Connexion" })).toBeVisible()

  await page.goto("/signup")
  await expect(page.getByRole("heading", { name: "Créer un compte" })).toBeVisible()
})

test("protected app routes redirect unauthenticated users to login", async ({ page }) => {
  await page.goto("/app/myteuf/dashboard")
  await expect(page).toHaveURL(/\/login\?next=%2Fapp%2Fmyteuf%2Fdashboard$/)
  await expect(page.getByRole("heading", { name: "Connexion" })).toBeVisible()
})

test("security headers are applied", async ({ request }) => {
  const response = await request.get("/")

  expect(response.headers()["x-frame-options"]).toBe("DENY")
  expect(response.headers()["x-content-type-options"]).toBe("nosniff")
  expect(response.headers()["referrer-policy"]).toBe("strict-origin-when-cross-origin")
  expect(response.headers()["content-security-policy"]).toContain("frame-ancestors 'none'")
})

test("onboarding can be completed to the data quality gate", async ({ page, request }) => {
  await skipUnlessE2EAuthWorks(request)

  await login(page)
  await page.goto("/app/onboarding")
  await expect(page.getByRole("heading", { name: "Onboarding" })).toBeVisible()

  for (let i = 0; i < 5; i += 1) {
    await page.getByRole("button", { name: "Enregistrer et continuer" }).click()
  }

  await expect(page.getByText("Définition de l'activation")).toBeVisible()
  await page.getByRole("button", { name: "Vérifier la qualité des données" }).click()
  await expect(page).toHaveURL(/\/data-quality$/)
})

test("core authenticated pages expose the expected product surfaces", async ({ page, request }) => {
  await skipUnlessE2EAuthWorks(request)

  await login(page)

  const pages = [
    ["/app/myteuf/dashboard", "Tableau de bord"],
    ["/app/myteuf/projects/prj_myteuf/evidence", "Preuves"],
    ["/app/myteuf/projects/prj_myteuf/event-mapping", "Mapping d'événements"],
    ["/app/myteuf/projects/prj_myteuf/data-quality", "Qualité des données"],
    ["/app/myteuf/projects/prj_myteuf/gateway", "Gateway"],
    ["/app/myteuf/projects/prj_myteuf/diagnostic", "Diagnostic"],
    ["/app/myteuf/projects/prj_myteuf/experiments", "Expériences"],
    ["/app/myteuf/projects/prj_myteuf/learnings", "Apprentissages"],
    ["/app/myteuf/settings", "Paramètres"],
  ] as const

  for (const [url, heading] of pages) {
    await page.goto(url)
    await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible()
  }
})

test("connector and gateway detail pages expose empty production state", async ({ page, request }) => {
  await skipUnlessE2EAuthWorks(request)

  await login(page)

  await page.goto("/app/myteuf/projects/prj_myteuf/connectors/ds_firebase")
  await expect(page.getByRole("heading", { name: "Firebase / Firestore à connecter" })).toBeVisible()
  await expect(page.getByText("Non connecté")).toBeVisible()
  await expect(page.getByRole("link", { name: /Configurer la source/ })).toBeVisible()

  await page.goto("/app/myteuf/projects/prj_myteuf/gateway")
  await expect(page.getByText("Aucun Gateway de production")).toBeVisible()
  await expect(page.getByText("Le Gateway mock reste réservé aux tests internes.")).toBeVisible()
})

test("server APIs reject unauthenticated dashboard actions", async ({ request }) => {
  const protectedRequests = [
    request.post("/api/connectors/ds_mock/sync"),
    request.post("/api/diagnostics/run"),
    request.post("/api/experiments/generate"),
    request.post("/api/gateway/test", { data: {} }),
    request.post("/api/gateway/gw_mock/test", { data: {} }),
    request.post("/api/mcp/proof-engine-gateway", { data: { operation: "events.read" } }),
    request.get("/api/settings/export"),
  ]

  const responses = await Promise.all(protectedRequests)
  for (const response of responses) {
    expect(response.status()).toBe(401)
    await expect(response.json()).resolves.toMatchObject({ ok: false, error: "unauthorized" })
  }
})

test("signed ingestion remains available without a browser session", async ({ request }) => {
  const unsigned = await request.post("/api/ingest/events", {
    data: {
      eventName: "guest_joined",
      occurredAt: "2026-06-24T10:00:00.000Z",
      actorId: "guest_api",
      actorType: "guest",
      entityId: "event_api",
      entityType: "sample_project",
      properties: {},
    },
  })
  expect(unsigned.status()).toBe(401)

  const body = JSON.stringify({
    eventName: "guest_joined",
    occurredAt: "2026-06-24T10:00:00.000Z",
    actorId: "guest_api",
    actorType: "guest",
    entityId: "event_api",
    entityType: "sample_project",
    properties: {},
  })
  const signature = createHmac("sha256", webhookConfig.secret).update(body).digest("hex")
  const signed = await request.post("/api/ingest/events", {
    headers: {
      "content-type": "application/json",
      "x-proof-engine-project-key": webhookConfig.projectKey,
      "x-proof-engine-signature": signature,
    },
    data: body,
  })

  expect(signed.ok()).toBeTruthy()
  await expect(signed.json()).resolves.toMatchObject({ ok: true, received: 1 })
})
