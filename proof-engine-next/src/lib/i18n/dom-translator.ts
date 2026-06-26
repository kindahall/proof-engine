"use client"

import { normalizeText, translateText, type Language } from "./dom-translations"

const translatedTextNodes = new WeakMap<Text, string>()
const translatedAttributes = new WeakMap<Element, Map<string, string>>()
const translatedFormValues = new WeakMap<HTMLInputElement | HTMLTextAreaElement, string>()

const TRANSLATABLE_ATTRIBUTES = ["aria-label", "alt", "placeholder", "title"] as const
const SKIPPED_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE"])

let activeObserver: MutationObserver | null = null
let activeLanguage: Language = "en"
let isApplying = false
let scheduled = false

export function startDomTranslator(language: Language) {
  activeLanguage = language
  applyDomTranslations(language)

  if (!activeObserver) {
    activeObserver = new MutationObserver(() => {
      if (isApplying || scheduled) return
      scheduled = true
      window.requestAnimationFrame(() => {
        scheduled = false
        applyDomTranslations(activeLanguage)
      })
    })
    activeObserver.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...TRANSLATABLE_ATTRIBUTES, "value"],
    })
  }

  return () => {
    activeObserver?.disconnect()
    activeObserver = null
  }
}

export function applyDomTranslations(language: Language) {
  if (typeof document === "undefined" || !document.body) return

  activeLanguage = language
  isApplying = true

  try {
    document.documentElement.lang = language
    translateTextNodes(document.body, language)
    translateElementAttributes(document.body, language)
    document.documentElement.dataset.i18nReady = "true"
  } finally {
    isApplying = false
  }
}

function translateTextNodes(root: HTMLElement, language: Language) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement
      if (!parent || SKIPPED_TAGS.has(parent.tagName)) return NodeFilter.FILTER_REJECT
      if (!normalizeText(node.nodeValue ?? "")) return NodeFilter.FILTER_REJECT
      return NodeFilter.FILTER_ACCEPT
    },
  })

  const nodes: Text[] = []
  while (walker.nextNode()) nodes.push(walker.currentNode as Text)

  for (const node of nodes) {
    // The node may have been detached by React between collection and mutation.
    // Writing to a detached node can race with React's commit phase, so skip it.
    if (!node.isConnected) continue
    if (language === "fr") {
      const current = node.nodeValue ?? ""
      const stored = translatedTextNodes.get(node)
      if (stored === undefined) {
        // First time we see this node: its current value is the French source.
        translatedTextNodes.set(node, current)
      } else if (current === translateText(stored)) {
        // Restore the original French only when the current value is the English translation.
        node.nodeValue = stored
      } else if (current !== stored) {
        // React may reuse a text node for new French content. Treat that as the new source.
        translatedTextNodes.set(node, current)
      }
      continue
    }

    let original = translatedTextNodes.get(node)
    const current = node.nodeValue ?? ""
    const previousEnglish = original ? translateText(original) : null

    if (!original || (language === "en" && current !== previousEnglish && current !== original)) {
      original = current
      translatedTextNodes.set(node, original)
    }

    const next = translateText(original)
    if (node.nodeValue !== next) node.nodeValue = next
  }
}

function translateElementAttributes(root: HTMLElement, language: Language) {
  const elements = [root, ...Array.from(root.querySelectorAll("*"))]

  for (const element of elements) {
    if (!element.isConnected) continue
    if (SKIPPED_TAGS.has(element.tagName)) continue

    let originals = translatedAttributes.get(element)
    if (!originals) {
      originals = new Map()
      translatedAttributes.set(element, originals)
    }

    for (const attr of TRANSLATABLE_ATTRIBUTES) {
      const current = element.getAttribute(attr)
      if (!current) continue

      if (language === "fr") {
        const stored = originals.get(attr)
        if (stored === undefined) originals.set(attr, current)
        else if (current === translateText(stored)) element.setAttribute(attr, stored)
        else if (current !== stored) originals.set(attr, current)
        continue
      }

      const original = originals.get(attr)
      const previousEnglish = original ? translateText(original) : null

      if (!original || (language === "en" && current !== previousEnglish && current !== original)) {
        originals.set(attr, current)
      }

      const source = originals.get(attr) ?? current
      const next = translateText(source)
      if (current !== next) element.setAttribute(attr, next)
    }

    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      translateFormValue(element, language)
    }
  }
}

function translateFormValue(element: HTMLInputElement | HTMLTextAreaElement, language: Language) {
  if (element.type === "password" || element.type === "email") return

  const current = element.value
  if (!current) return

  if (language === "fr") {
    const stored = translatedFormValues.get(element)
    if (stored === undefined) translatedFormValues.set(element, current)
    else if (current === translateText(stored)) element.value = stored
    else if (current !== stored) translatedFormValues.set(element, current)
    return
  }

  let original = translatedFormValues.get(element)
  const previousEnglish = original ? translateText(original) : null

  if (!original || (current !== previousEnglish && current !== original)) {
    original = current
    translatedFormValues.set(element, original)
  }

  const next = translateText(original)
  if (current !== next) element.value = next
}
