import { z } from "zod"

export const siteFactSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  keywords: z.array(z.string().min(1)).min(1),
})

export const sitePageSnapshotSchema = z.object({
  id: z.string().min(1),
  url: z.string().min(1),
  title: z.string().min(1),
  facts: z.array(siteFactSchema).min(1),
})

export const siteQuestionSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(1),
  expectedFactIds: z.array(z.string().min(1)),
  expectedAnswerIncludes: z.array(z.string().min(1)).default([]),
  allowRefusal: z.boolean().default(false),
})

export const siteAnswerSchema = z.object({
  questionId: z.string().min(1),
  answer: z.string().min(1),
  citedFactIds: z.array(z.string().min(1)),
  confidence: z.number().min(0).max(1),
  refused: z.boolean().default(false),
})

export type SitePageSnapshot = z.infer<typeof sitePageSnapshotSchema>
export type SiteQuestion = z.infer<typeof siteQuestionSchema>
export type SiteAnswer = z.infer<typeof siteAnswerSchema>

export interface SiteQaEvaluation {
  ok: boolean
  checked: number
  errors: string[]
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

function flattenFacts(pages: SitePageSnapshot[]) {
  return pages.flatMap((page) =>
    page.facts.map((fact) => ({
      ...fact,
      pageId: page.id,
      pageTitle: page.title,
      url: page.url,
    })),
  )
}

export function answerWithDeterministicSubAgent(input: {
  pages: SitePageSnapshot[]
  questions: SiteQuestion[]
}): SiteAnswer[] {
  const pages = sitePageSnapshotSchema.array().parse(input.pages)
  const questions = siteQuestionSchema.array().parse(input.questions)
  const facts = flattenFacts(pages)

  return questions.map((question) => {
    const normalizedQuestion = normalize(question.question)
    const ranked = facts
      .map((fact) => {
        const score = fact.keywords.reduce((total, keyword) => {
          return normalizedQuestion.includes(normalize(keyword)) ? total + 1 : total
        }, 0)
        return { fact, score }
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)

    if (ranked.length === 0) {
      return siteAnswerSchema.parse({
        questionId: question.id,
        answer: "Je ne peux pas repondre avec le snapshot fourni.",
        citedFactIds: [],
        confidence: 0,
        refused: true,
      })
    }

    const selected = ranked[0].fact
    return siteAnswerSchema.parse({
      questionId: question.id,
      answer: `${selected.text} Source: ${selected.pageTitle}.`,
      citedFactIds: [selected.id],
      confidence: Math.min(1, ranked[0].score / Math.max(1, selected.keywords.length)),
      refused: false,
    })
  })
}

export function evaluateSiteQaAnswers(input: {
  pages: SitePageSnapshot[]
  questions: SiteQuestion[]
  answers: SiteAnswer[]
}): SiteQaEvaluation {
  const pages = sitePageSnapshotSchema.array().parse(input.pages)
  const questions = siteQuestionSchema.array().parse(input.questions)
  const answers = siteAnswerSchema.array().parse(input.answers)
  const knownFactIds = new Set(flattenFacts(pages).map((fact) => fact.id))
  const answersByQuestion = new Map(answers.map((answer) => [answer.questionId, answer]))
  const errors: string[] = []

  for (const question of questions) {
    const answer = answersByQuestion.get(question.id)
    if (!answer) {
      errors.push(`${question.id}: missing answer`)
      continue
    }

    const unknownCitations = answer.citedFactIds.filter((factId) => !knownFactIds.has(factId))
    if (unknownCitations.length > 0) {
      errors.push(`${question.id}: unknown citations ${unknownCitations.join(", ")}`)
    }

    if (question.expectedFactIds.length > 0 && answer.refused) {
      errors.push(`${question.id}: refused despite expected supporting facts`)
    }

    for (const factId of question.expectedFactIds) {
      if (!answer.citedFactIds.includes(factId)) {
        errors.push(`${question.id}: missing expected citation ${factId}`)
      }
    }

    const normalizedAnswer = normalize(answer.answer)
    for (const requiredText of question.expectedAnswerIncludes) {
      if (!normalizedAnswer.includes(normalize(requiredText))) {
        errors.push(`${question.id}: answer does not include "${requiredText}"`)
      }
    }

    if (question.allowRefusal && !answer.refused) {
      errors.push(`${question.id}: expected refusal for out-of-scope question`)
    }
  }

  return {
    ok: errors.length === 0,
    checked: questions.length,
    errors,
  }
}
