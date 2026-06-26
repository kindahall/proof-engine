"use client"

import { AnalyticsBrowser } from "@segment/analytics-next"
import { marketingAnalyticsConfig } from "@/config/marketing-analytics"
import {
  getSubscriptionPlanProperties,
  marketingAnalyticsEvents,
  type BillingInterval,
  type MarketingAnalyticsEvent,
  type MarketingAnalyticsProperties,
  type SubscriptionPlanTrackingInput,
} from "./events"

type AnalyticsWindow = Window & {
  __proofEngineSegmentAnalytics?: AnalyticsBrowser
}

function getAnalytics() {
  if (typeof window === "undefined" || !marketingAnalyticsConfig.enabled) {
    return null
  }

  const analyticsWindow = window as AnalyticsWindow

  if (!analyticsWindow.__proofEngineSegmentAnalytics) {
    analyticsWindow.__proofEngineSegmentAnalytics = AnalyticsBrowser.load({
      writeKey: marketingAnalyticsConfig.segmentWriteKey,
    })
  }

  return analyticsWindow.__proofEngineSegmentAnalytics
}

function withBaseProperties(
  properties: MarketingAnalyticsProperties = {},
): MarketingAnalyticsProperties {
  return {
    app: "proof_engine",
    runtime_mode: marketingAnalyticsConfig.runtimeMode,
    ...properties,
  }
}

export function trackMarketingEvent(
  event: MarketingAnalyticsEvent,
  properties: MarketingAnalyticsProperties = {},
) {
  const analytics = getAnalytics()
  if (!analytics) return

  void analytics.track(event, withBaseProperties(properties))
}

export function trackPageView(properties: MarketingAnalyticsProperties) {
  const analytics = getAnalytics()
  if (!analytics) return

  void analytics.page(
    "Proof Engine",
    typeof document === "undefined" ? "Page" : document.title,
    withBaseProperties({
      conversion_target: "subscription",
      ...properties,
    }),
  )
}

export function trackSubscriptionCtaClicked(properties: MarketingAnalyticsProperties) {
  trackMarketingEvent(marketingAnalyticsEvents.subscriptionCtaClicked, {
    conversion_target: "subscription",
    ...properties,
  })
}

export function trackSubscriptionPlanSelected({
  billingInterval,
  plan,
  ...properties
}: SubscriptionPlanTrackingInput & {
  billingInterval: BillingInterval
  source: string
  destination: string
}) {
  const planProperties = getSubscriptionPlanProperties({ plan, billingInterval })

  trackMarketingEvent(marketingAnalyticsEvents.subscriptionPlanSelected, {
    ...planProperties,
    ...properties,
  })

  if (plan.monthly > 0) {
    trackSubscriptionIntentCaptured({
      ...planProperties,
      ...properties,
      intent_stage: "plan_selected",
    })
  }
}

export function trackSignupCompleted(properties: MarketingAnalyticsProperties) {
  trackMarketingEvent(marketingAnalyticsEvents.signupCompleted, {
    conversion_target: "subscription",
    ...properties,
  })
}

export function trackContactSubmitted(properties: MarketingAnalyticsProperties) {
  trackMarketingEvent(marketingAnalyticsEvents.contactSubmitted, {
    conversion_target: "subscription",
    ...properties,
  })
}

export function trackOnboardingCompleted(properties: MarketingAnalyticsProperties) {
  trackMarketingEvent(marketingAnalyticsEvents.onboardingCompleted, {
    conversion_target: "subscription",
    ...properties,
  })
}

export function trackSubscriptionIntentCaptured(
  properties: MarketingAnalyticsProperties,
) {
  trackMarketingEvent(marketingAnalyticsEvents.subscriptionIntentCaptured, {
    conversion_target: "subscription",
    ...properties,
  })
}

export function trackSubscriptionStarted(properties: MarketingAnalyticsProperties) {
  trackMarketingEvent(marketingAnalyticsEvents.subscriptionStarted, {
    conversion_target: "subscription",
    conversion_type: "paid_subscription",
    ...properties,
  })
}
