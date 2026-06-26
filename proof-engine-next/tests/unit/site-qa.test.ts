import { describe, expect, it } from "vitest"
import {
  answerWithDeterministicSubAgent,
  evaluateSiteQaAnswers,
  type SiteQuestion,
} from "@/lib/ai/site-qa"
import { atelierNovaQuestions, atelierNovaSite } from "../fixtures/site-qa/atelier-nova"

describe("fake Codex-connected site QA harness", () => {
  it("answers site questions with the expected cited facts", () => {
    const answers = answerWithDeterministicSubAgent({ pages: atelierNovaSite, questions: atelierNovaQuestions })
    const evaluation = evaluateSiteQaAnswers({ pages: atelierNovaSite, questions: atelierNovaQuestions, answers })

    expect(evaluation).toMatchObject({ ok: true, checked: 3, errors: [] })
  })

  it("rejects hallucinated answers and unknown citations", () => {
    const evaluation = evaluateSiteQaAnswers({
      pages: atelierNovaSite,
      questions: [atelierNovaQuestions[0]],
      answers: [
        {
          questionId: "q_price",
          answer: "Atelier Nova coute 49 EUR par mois.",
          citedFactIds: ["pricing.enterprise"],
          confidence: 0.9,
          refused: false,
        },
      ],
    })

    expect(evaluation.ok).toBe(false)
    expect(evaluation.errors).toContain("q_price: unknown citations pricing.enterprise")
    expect(evaluation.errors).toContain("q_price: missing expected citation pricing.monthly")
    expect(evaluation.errors).toContain("q_price: answer does not include \"19 EUR par mois\"")
  })

  it("refuses questions outside the supplied fake site snapshot", () => {
    const outOfScope: SiteQuestion = {
      id: "q_ceo",
      question: "Qui est le CEO ?",
      expectedFactIds: [],
      expectedAnswerIncludes: [],
      allowRefusal: true,
    }

    const [answer] = answerWithDeterministicSubAgent({ pages: atelierNovaSite, questions: [outOfScope] })
    const evaluation = evaluateSiteQaAnswers({ pages: atelierNovaSite, questions: [outOfScope], answers: [answer] })

    expect(answer.refused).toBe(true)
    expect(answer.citedFactIds).toEqual([])
    expect(evaluation.ok).toBe(true)
  })
})
