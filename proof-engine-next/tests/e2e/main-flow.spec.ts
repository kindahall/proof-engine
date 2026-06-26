import { test, expect, type APIRequestContext, type Page } from "@playwright/test"

const e2eAuth = {
  email: process.env.E2E_AUTH_EMAIL,
  password: process.env.E2E_AUTH_PASSWORD,
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

test("main Proof Engine flow stays empty until a source is connected", async ({ page, request }) => {
  await skipUnlessE2EAuthWorks(request)

  await login(page)

  await page.goto("/app/myteuf/dashboard")
  await expect(page.getByRole("heading", { name: "Tableau de bord" })).toBeVisible()
  await expect(page.getByText("Diagnostic bloqué")).toBeVisible()
  await expect(page.getByText("Aucune métrique n'est affichée")).toBeVisible()
  await expect(page.getByText("Sources connectées")).toBeVisible()
  await expect(page.getByText("0/6")).toBeVisible()

  await page.goto("/app/myteuf/projects/prj_myteuf/connectors")
  await expect(page.getByText("Firebase / Firestore à connecter")).toBeVisible()
  await expect(page.getByText("Non connecté").first()).toBeVisible()
  await expect(page.getByText("0 enregistrements").first()).toBeVisible()

  await page.goto("/app/myteuf/projects/prj_myteuf/connectors/new")
  await page.getByRole("button", { name: /Firebase \/ Firestore/ }).click()
  await page.getByRole("button", { name: "Continuer" }).click()
  await page.getByRole("button", { name: "Continuer" }).click()
  await page.getByRole("button", { name: /Tester la connexion/ }).click()
  await expect(page.getByText("Connexion à la source non disponible")).toBeVisible()
  await expect(page.getByText("Ajoutez les identifiants en lecture seule de la source avant le test.").first()).toBeVisible()
  await expect(page.getByRole("button", { name: "Continuer" })).toBeDisabled()

  await page.goto("/app/myteuf/projects/prj_myteuf/data-quality")
  await expect(page.getByText("Diagnostic bloqué")).toBeVisible()
  await expect(page.getByText("Aucune synchronisation réussie")).toBeVisible()
  await expect(page.getByText("Données réelles insuffisantes.")).toBeVisible()

  await page.goto("/app/myteuf/projects/prj_myteuf/diagnostic")
  await expect(page.getByText("Diagnostic non disponible", { exact: true })).toBeVisible()
  await expect(page.getByRole("heading", { name: "Données réelles insuffisantes" })).toBeVisible()

  await page.goto("/app/myteuf/projects/prj_myteuf/evidence")
  await expect(page.getByText("Aucune preuve synchronisée")).toBeVisible()

  await page.goto("/app/myteuf/projects/prj_myteuf/event-mapping")
  await expect(page.getByText("Aucun mapping confirmé")).toBeVisible()
  await expect(page.getByText("Les événements du projet ne sont pas encore connus.")).toBeVisible()
  await expect(page.getByText("Mappings actifs : 0")).toBeVisible()

  await page.goto("/app/myteuf/projects/prj_myteuf/gateway")
  await expect(page.getByText("Aucun Gateway de production")).toBeVisible()

  await page.goto("/app/myteuf/projects/prj_myteuf/experiments")
  await expect(page.getByText("Aucune expérience disponible")).toBeVisible()

  await page.goto("/app/myteuf/projects/prj_myteuf/learnings")
  await expect(page.getByText("Aucun apprentissage")).toBeVisible()
})
