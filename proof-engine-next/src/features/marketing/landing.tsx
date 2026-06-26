"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useRef } from "react"
import {
  ArrowRight,
  Plug,
  Compass,
  FlaskConical,
  Target,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  Radio,
  HelpCircle,
  CircleHelp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/shared/logo"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { LanguageToggle } from "@/components/i18n/language-toggle"
import { product } from "@/config/product"
import { routes } from "@/lib/routes"
import { Reveal } from "./reveal"
import { InteractivePreview } from "./interactive-preview"
import { FeatureShowcase } from "./feature-showcase"
import { Testimonials } from "./testimonials"
import { Pricing } from "./pricing"
import { Faq } from "./faq"
import { Contact } from "./contact"
import { stats } from "./content"
import { trackSubscriptionCtaClicked } from "@/lib/marketing-analytics/client"

const steps = [
  { icon: Plug, n: "01", title: "Connectez", text: "Vos données réelles, en lecture seule.", accent: "text-primary", ring: "group-hover:border-primary/40" },
  { icon: Compass, n: "02", title: "Diagnostiquez", text: "Un seul goulot prioritaire, fondé sur vos preuves.", accent: "text-emerald-600", ring: "group-hover:border-emerald-400/40" },
  { icon: FlaskConical, n: "03", title: "Testez", text: "Une expérience, suivie automatiquement.", accent: "text-amber-600", ring: "group-hover:border-amber-400/40" },
]

const legend = [
  { icon: CheckCircle2, label: "Faits", color: "text-emerald-600", bg: "bg-emerald-500/10" },
  { icon: Radio, label: "Signaux", color: "text-primary", bg: "bg-primary/10" },
  { icon: HelpCircle, label: "Hypothèses", color: "text-amber-600", bg: "bg-amber-500/10" },
  { icon: CircleHelp, label: "Inconnues", color: "text-muted-foreground", bg: "bg-muted" },
]

const values = [
  { icon: Target, title: "Décidez avec preuve" },
  { icon: RefreshCw, title: "Apprenez en continu" },
  { icon: ShieldCheck, title: "Gagnez en confiance" },
]

const nav = [
  { href: "#fonctionnement", label: "Fonctionnement" },
  { href: "#produit", label: "Produit" },
  { href: "#tarifs", label: "Tarifs" },
  { href: "#contact", label: "Contact" },
]

export function Landing() {
  const glowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const el = glowRef.current
      if (!el) return
      el.style.setProperty("--mx", `${e.clientX}px`)
      el.style.setProperty("--my", `${e.clientY}px`)
    }
    window.addEventListener("pointermove", onMove)
    return () => window.removeEventListener("pointermove", onMove)
  }, [])

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip">
      <div
        ref={glowRef}
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(380px circle at var(--mx, 50%) var(--my, 0px), color-mix(in oklch, var(--primary) 14%, transparent), transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[520px] w-[820px] -translate-x-1/2 rounded-full opacity-60 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklch, var(--primary) 22%, transparent), transparent 60%), radial-gradient(circle at 70% 30%, color-mix(in oklch, oklch(0.7 0.17 162) 18%, transparent), transparent 60%)",
        }}
      />

      <header className="sticky top-0 z-20 flex items-center justify-between border-b bg-background/70 px-6 py-4 backdrop-blur-md">
        <Logo />
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground lg:flex">
          {nav.map((n) => (
            <a key={n.href} href={n.href} className="transition-colors hover:text-foreground">{n.label}</a>
          ))}
          <Link href={routes.login} className="transition-colors hover:text-foreground">Connexion</Link>
        </nav>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
          <Button asChild>
            <Link
              href={routes.onboarding}
              onClick={() =>
                trackSubscriptionCtaClicked({
                  destination: "onboarding",
                  placement: "header",
                })
              }
            >
              {product.primaryCta}
            </Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:grid-cols-2 md:py-28">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <span className="size-1.5 rounded-full bg-primary pe-pulse-dot" />
              {product.tagline}
            </span>
            <h1 className="mt-4 text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
              Arrêtez le marketing <span className="pe-grad-text">à l&apos;aveugle</span>.
            </h1>
            <p className="mt-5 max-w-md text-lg text-muted-foreground">{product.marketingSubtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="group shadow-lg shadow-primary/20">
                <Link
                  href={routes.onboarding}
                  onClick={() =>
                    trackSubscriptionCtaClicked({
                      destination: "onboarding",
                      placement: "hero_primary",
                    })
                  }
                >
                  {product.primaryCta}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href={routes.dashboard}>Voir le tableau de bord</Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2">
              {legend.map((l) => (
                <span key={l.label} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className={`flex size-5 items-center justify-center rounded-md ${l.bg}`}>
                    <l.icon className={`size-3 ${l.color}`} />
                  </span>
                  {l.label}
                </span>
              ))}
            </div>
          </Reveal>

          <Reveal delay={120}>
            <InteractivePreview />
          </Reveal>
        </section>

        {/* Stats band */}
        <section className="border-y bg-muted/20">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-6 py-10 md:grid-cols-4">
            {stats.map((s, i) => (
              <Reveal key={s.label} delay={i * 80}>
                <div className="text-center">
                  <p className="text-3xl font-bold tracking-tight pe-grad-text">{s.value}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="fonctionnement" className="border-b">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <Reveal>
              <p className="text-sm font-medium text-primary">Comment ça marche</p>
              <h2 className="mt-1 text-3xl font-semibold tracking-tight">Trois temps, une boucle.</h2>
            </Reveal>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {steps.map((s, i) => (
                <Reveal key={s.title} delay={i * 120}>
                  <div className={`group h-full rounded-2xl border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${s.ring}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex size-11 items-center justify-center rounded-xl bg-muted transition-colors group-hover:bg-background">
                        <s.icon className={`size-5 ${s.accent}`} />
                      </div>
                      <span className="font-mono text-sm text-muted-foreground/50">{s.n}</span>
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                    <p className="mt-1.5 text-sm text-muted-foreground">{s.text}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Product showcase (interactive tabs + images) */}
        <section id="produit" className="border-b bg-muted/20">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <Reveal>
              <p className="text-sm font-medium text-primary">Le produit</p>
              <h2 className="mt-1 text-3xl font-semibold tracking-tight">Voyez Proof Engine en action.</h2>
              <p className="mt-2 max-w-xl text-muted-foreground">Cliquez pour explorer chaque étape de la boucle.</p>
            </Reveal>
            <Reveal delay={100} className="mt-10">
              <FeatureShowcase />
            </Reveal>
          </div>
        </section>

        {/* Evidence-first band */}
        <section className="border-b">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="grid items-center gap-10 md:grid-cols-2">
              <Reveal>
                <p className="text-sm font-medium text-primary">Evidence first</p>
                <h2 className="mt-1 text-3xl font-semibold tracking-tight">Chaque décision, reliée à une preuve.</h2>
                <p className="mt-4 max-w-md text-muted-foreground">
                  Faits, signaux, hypothèses, inconnues : tout est séparé visuellement. Pas de fausse certitude — quand les
                  données manquent, on le dit.
                </p>
                <Link
                  href={routes.onboarding}
                  className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-primary"
                  onClick={() =>
                    trackSubscriptionCtaClicked({
                      destination: "onboarding",
                      placement: "evidence_band",
                    })
                  }
                >
                  Connecter mes données <ArrowRight className="size-4" />
                </Link>
              </Reveal>
              <Reveal delay={120}>
                <div className="grid grid-cols-2 gap-3">
                  {legend.map((l) => (
                    <div key={l.label} className="group rounded-xl border bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                      <div className={`flex size-9 items-center justify-center rounded-lg ${l.bg}`}>
                        <l.icon className={`size-4.5 ${l.color}`} />
                      </div>
                      <p className="mt-3 font-medium">{l.label}</p>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="temoignages" className="border-b bg-muted/20">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <Reveal>
              <p className="text-sm font-medium text-primary">Ils décident avec preuve</p>
              <h2 className="mt-1 text-3xl font-semibold tracking-tight">Ce qu'en disent les équipes.</h2>
            </Reveal>
            <Reveal delay={100} className="mt-10">
              <Testimonials />
            </Reveal>
          </div>
        </section>

        {/* Pricing */}
        <section id="tarifs" className="border-b">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <Reveal className="text-center">
              <p className="text-sm font-medium text-primary">Tarifs</p>
              <h2 className="mt-1 text-3xl font-semibold tracking-tight">Un plan pour chaque étape.</h2>
            </Reveal>
            <Reveal delay={100} className="mt-10">
              <Pricing />
            </Reveal>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="border-b bg-muted/20">
          <div className="mx-auto max-w-3xl px-6 py-20">
            <Reveal className="text-center">
              <p className="text-sm font-medium text-primary">FAQ</p>
              <h2 className="mt-1 text-3xl font-semibold tracking-tight">Questions fréquentes.</h2>
            </Reveal>
            <Reveal delay={100} className="mt-8">
              <Faq />
            </Reveal>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="border-b">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <Reveal>
              <Contact />
            </Reveal>
          </div>
        </section>

        {/* CTA band */}
        <section className="border-b">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <Reveal>
              <div className="relative overflow-hidden rounded-3xl border bg-primary px-8 py-14 text-center text-primary-foreground">
                <Image
                  src="/landing/duo.png"
                  alt=""
                  fill
                  aria-hidden
                  className="pointer-events-none object-cover opacity-15"
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-30"
                  style={{ background: "radial-gradient(600px circle at 30% 20%, white, transparent 60%)" }}
                />
                <div className="relative">
                  <h2 className="text-3xl font-semibold tracking-tight">Prêt à voir votre vrai blocage ?</h2>
                  <p className="mx-auto mt-3 max-w-md opacity-90">Connectez une source, lancez votre premier diagnostic.</p>
                  <Button asChild size="lg" variant="secondary" className="mt-7">
                    <Link
                      href={routes.onboarding}
                      onClick={() =>
                        trackSubscriptionCtaClicked({
                          destination: "onboarding",
                          placement: "bottom_cta",
                        })
                      }
                    >
                      {product.primaryCta} <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <footer>
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Logo size={22} />
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">{product.tagline}</p>
            <div className="mt-4 flex gap-5">
              {values.map((v) => (
                <div key={v.title} className="flex flex-col items-center gap-1.5 text-center">
                  <v.icon className="size-4 text-primary" />
                  <span className="text-[10px] font-medium text-muted-foreground">{v.title}</span>
                </div>
              ))}
            </div>
          </div>
          <FooterCol title="Produit" links={[["Fonctionnement", "#fonctionnement"], ["Produit", "#produit"], ["Tarifs", "#tarifs"], ["FAQ", "#faq"]]} />
          <FooterCol title="Entreprise" links={[["Témoignages", "#temoignages"], ["Contact", "#contact"], ["Connexion", routes.login]]} />
          <FooterCol title="Légal" links={[["Confidentialité", routes.privacy], ["Conditions", routes.terms]]} />
        </div>
        <div className="border-t">
          <div className="mx-auto max-w-6xl px-6 py-5 text-xs text-muted-foreground">
            © 2026 {product.name}. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  )
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="text-sm font-medium">{title}</p>
      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
        {links.map(([label, href]) => (
          <li key={label}>
            <Link href={href} className="transition-colors hover:text-foreground">{label}</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
