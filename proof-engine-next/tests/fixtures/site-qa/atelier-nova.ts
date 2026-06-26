import type { SitePageSnapshot, SiteQuestion } from "@/lib/ai/site-qa"

export const atelierNovaSite: SitePageSnapshot[] = [
  {
    id: "pricing",
    url: "https://atelier-nova.test/tarifs",
    title: "Tarifs Atelier Nova",
    facts: [
      {
        id: "pricing.monthly",
        text: "Atelier Nova coute 19 EUR par mois pour une equipe de trois personnes.",
        keywords: ["combien", "prix", "tarif", "coute"],
      },
    ],
  },
  {
    id: "security",
    url: "https://atelier-nova.test/securite",
    title: "Securite",
    facts: [
      {
        id: "security.readonly",
        text: "Le connecteur fonctionne en lecture seule et ne peut faire aucune ecriture dans Firebase.",
        keywords: ["firebase", "ecrire", "ecriture", "lecture seule"],
      },
    ],
  },
  {
    id: "codex",
    url: "https://atelier-nova.test/codex",
    title: "Connexion Codex",
    facts: [
      {
        id: "codex.snapshot",
        text: "Le sous-agent Codex recoit uniquement un snapshot JSON du site et doit citer les faits utilises.",
        keywords: ["codex", "sous-agent", "snapshot", "informations"],
      },
    ],
  },
]

export const atelierNovaQuestions: SiteQuestion[] = [
  {
    id: "q_price",
    question: "Combien coute Atelier Nova ?",
    expectedFactIds: ["pricing.monthly"],
    expectedAnswerIncludes: ["19 EUR par mois"],
    allowRefusal: false,
  },
  {
    id: "q_firebase_write",
    question: "Est-ce que le sous-agent peut ecrire dans Firebase ?",
    expectedFactIds: ["security.readonly"],
    expectedAnswerIncludes: ["aucune ecriture dans Firebase"],
    allowRefusal: false,
  },
  {
    id: "q_codex_input",
    question: "Quelles informations le sous-agent Codex recoit-il ?",
    expectedFactIds: ["codex.snapshot"],
    expectedAnswerIncludes: ["snapshot JSON du site"],
    allowRefusal: false,
  },
]
