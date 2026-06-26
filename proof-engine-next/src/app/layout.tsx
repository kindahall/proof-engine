import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { LanguageProvider } from "@/components/i18n/language-provider"
import { MarketingAnalytics } from "@/components/analytics/marketing-analytics"
import { Toaster } from "@/components/ui/sonner"
import { product } from "@/config/product"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: `${product.name} — ${product.marketingTitle}`,
    template: `%s · ${product.name}`,
  },
  description: product.marketingSubtitle,
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider>
            {children}
            <MarketingAnalytics />
            <Toaster richColors position="top-right" />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
