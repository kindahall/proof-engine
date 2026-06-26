/**
 * Centralized product configuration.
 * The product name is provisional ("Proof Engine") and centralized here
 * so it can be changed in a single place, as required by the spec.
 */
export const product = {
  name: "Proof Engine",
  tagline: "Marketing fondé sur preuves",
  marketingTitle: "Arrêtez le marketing à l'aveugle.",
  marketingSubtitle: "Trouvez votre vrai blocage. Testez-le. Apprenez.",
  primaryCta: "Créer mon diagnostic",
  price: { amount: 49, currency: "€", period: "mois" },
} as const

export const runtimeMode = process.env.NEXT_PUBLIC_PROOF_ENGINE_RUNTIME ?? "local"
