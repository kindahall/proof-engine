import type { Plan } from "@/features/marketing/content"

export const marketingAnalyticsEvents = {
  contactSubmitted: "Contact Submitted",
  onboardingCompleted: "Onboarding Completed",
  pageViewed: "Page Viewed",
  signupCompleted: "Signup Completed",
  subscriptionCtaClicked: "Subscription CTA Clicked",
  subscriptionIntentCaptured: "Subscription Intent Captured",
  subscriptionPlanSelected: "Subscription Plan Selected",
  subscriptionStarted: "Subscription Started",
} as const

export type MarketingAnalyticsEvent =
  (typeof marketingAnalyticsEvents)[keyof typeof marketingAnalyticsEvents]

export type BillingInterval = "monthly" | "yearly"

export type MarketingAnalyticsProperties = Record<string, unknown>

export type SubscriptionPlanTrackingInput = {
  plan: Pick<Plan, "id" | "name" | "monthly" | "yearly">
  billingInterval: BillingInterval
}

export function getSubscriptionPlanProperties({
  plan,
  billingInterval,
}: SubscriptionPlanTrackingInput): MarketingAnalyticsProperties {
  const monthlyPrice = billingInterval === "yearly" ? plan.yearly : plan.monthly

  return {
    billing_interval: billingInterval,
    conversion_target: "subscription",
    currency: "EUR",
    plan_id: plan.id,
    plan_name: plan.name,
    recurring_interval: "month",
    recurring_revenue: monthlyPrice,
    value: monthlyPrice,
  }
}
