// Marketing content. Testimonials and figures are illustratives — à remplacer
// par de vrais contenus avant mise en production (la spec interdit les fausses
// preuves sociales en prod).

export const stats = [
  { value: "1 000+", label: "événements analysés" },
  { value: "4", label: "types de connecteurs read-only" },
  { value: "1", label: "goulot prioritaire à la fois" },
  { value: "0", label: "métrique saisie à la main" },
]

export type Feature = {
  key: string
  tab: string
  title: string
  text: string
  bullets: string[]
  image: string
  alt: string
}

export const features: Feature[] = [
  {
    key: "connect",
    tab: "Connecter",
    title: "Vos données réelles, pas vos impressions",
    text: "Branchez Supabase, Firebase, un endpoint REST, un webhook ou Stripe — en lecture seule. Proof Engine lit, normalise et calcule vos métriques automatiquement.",
    bullets: ["Connexion en lecture seule", "Secrets chiffrés côté serveur", "Synchronisation automatique"],
    image: "/landing/desk.png",
    alt: "Tableau de bord Proof Engine sur un ordinateur portable",
  },
  {
    key: "diagnose",
    tab: "Diagnostiquer",
    title: "Un seul goulot, fondé sur vos preuves",
    text: "Faits, signaux, hypothèses et inconnues sont séparés. Le moteur déterministe calcule la confiance ; l'IA explique, sans jamais inventer.",
    bullets: ["Séparation faits / signaux / hypothèses", "Confiance calculée, pas devinée", "Chaque conclusion reliée à ses preuves"],
    image: "/landing/meeting.png",
    alt: "Équipe analysant le diagnostic Proof Engine sur grand écran",
  },
  {
    key: "experiment",
    tab: "Expérimenter",
    title: "Une expérience mesurable, suivie toute seule",
    text: "Hypothèse, métrique, guardrails et règles de décision. La baseline est capturée automatiquement, les résultats se synchronisent.",
    bullets: ["Une seule expérience active à la fois", "Suivi automatique des résultats", "Règles continuer / modifier / arrêter"],
    image: "/landing/tablet.png",
    alt: "Expériences Proof Engine sur une tablette",
  },
  {
    key: "learn",
    tab: "Apprendre",
    title: "Chaque résultat devient un apprentissage",
    text: "Validé, invalidé ou non concluant — avec ce qui est prouvé, ce qui ne l'est pas, et les questions restantes. Vos apprentissages se cumulent.",
    bullets: ["Apprentissages réutilisables", "Causalité signalée honnêtement", "Prochaine action recommandée"],
    image: "/landing/duo.png",
    alt: "Deux personnes consultant leurs apprentissages Proof Engine",
  },
]

export const testimonials = [
  {
    quote: "On a arrêté de deviner. En une semaine, on savait que notre blocage était l'activation, pas l'acquisition.",
    name: "Camille R.",
    role: "Fondatrice, SaaS événementiel",
    initials: "CR",
  },
  {
    quote: "Le fait que chaque recommandation soit reliée à une preuve a changé nos réunions produit.",
    name: "Sofiane B.",
    role: "Head of Growth, app mobile",
    initials: "SB",
  },
  {
    quote: "Plus de tableurs à remplir. Les métriques viennent directement de notre backend.",
    name: "Léa M.",
    role: "Co-fondatrice, marketplace",
    initials: "LM",
  },
]

export type Plan = {
  id: "solo" | "team" | "scale"
  name: string
  tagline: string
  monthly: number
  yearly: number
  features: string[]
  highlight?: boolean
  cta: string
}

export const plans: Plan[] = [
  {
    id: "solo",
    name: "Solo",
    tagline: "Pour valider un premier produit",
    monthly: 0,
    yearly: 0,
    features: ["1 projet", "1 connecteur read-only", "Diagnostic & 1 expérience active", "Apprentissages"],
    cta: "Commencer gratuitement",
  },
  {
    id: "team",
    name: "Équipe",
    tagline: "Pour piloter la croissance à plusieurs",
    monthly: 49,
    yearly: 39,
    features: ["Projets illimités", "Tous les connecteurs + Gateway", "Expériences & ressources générées", "Jusqu'à 5 membres"],
    highlight: true,
    cta: "Créer mon diagnostic",
  },
  {
    id: "scale",
    name: "Scale",
    tagline: "Pour les équipes data exigeantes",
    monthly: 149,
    yearly: 119,
    features: ["Tout Équipe", "Gateway Codex / MCP", "Audit complet & traçabilité", "Support prioritaire"],
    cta: "Parler à l'équipe",
  },
]

export const faqs = [
  {
    q: "Dois-je connecter un backend pour commencer ?",
    a: "Oui, c'est le cœur du produit. Sans source connectée, le diagnostic reste « insuffisant » et la confiance plafonnée — on ne vous donne jamais de fausse certitude. La connexion est en lecture seule et prend quelques minutes.",
  },
  {
    q: "Mes données sont-elles en sécurité ?",
    a: "Toutes les connexions sont en lecture seule. Les secrets sont chiffrés côté serveur et ne transitent jamais par le navigateur. Vos données sont isolées par espace de travail, et vous pouvez supprimer un connecteur (et ses secrets) à tout moment.",
  },
  {
    q: "Est-ce que je saisis mes chiffres à la main ?",
    a: "Jamais pour les métriques et les résultats : ils viennent de vos sources connectées. Vous pouvez seulement ajouter des notes qualitatives et des hypothèses, clairement distinguées des données réelles.",
  },
  {
    q: "L'IA invente-t-elle des recommandations ?",
    a: "Non. La décision (validé / invalidé / insuffisant) est prise par des règles déterministes. L'IA explique et propose, en citant toujours les preuves utilisées. Elle n'a jamais accès à vos secrets.",
  },
  {
    q: "Pourquoi une seule expérience active à la fois ?",
    a: "Pour garder des résultats fiables et attribuables. Lancer dix tests en parallèle brouille les signaux ; une priorité claire produit des apprentissages exploitables.",
  },
]
