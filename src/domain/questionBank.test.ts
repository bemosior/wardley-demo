import { describe, expect, it } from "vitest";
import {
  BIAS_CHECK_QUESTION,
  BUILD_BUY_OUTSOURCE_QUESTION,
  pickRandomQuestion,
  QUESTION_POOL,
  type Question,
} from "./questionBank";

function expectValidQuestion(question: Question): void {
  expect(question.prompt.trim().length).toBeGreaterThan(0);
  expect(question.options.length).toBeGreaterThan(0);
  for (const option of question.options) {
    expect(option.label.trim().length).toBeGreaterThan(0);
    expect(option.annotation.trim().length).toBeGreaterThan(0);
  }
  const ids = question.options.map((o) => o.id);
  expect(new Set(ids).size).toBe(ids.length);
}

describe("BIAS_CHECK_QUESTION", () => {
  it("is a well-formed question", () => expectValidQuestion(BIAS_CHECK_QUESTION));
});

describe("BUILD_BUY_OUTSOURCE_QUESTION", () => {
  it("is a well-formed question", () => expectValidQuestion(BUILD_BUY_OUTSOURCE_QUESTION));
});

describe("QUESTION_POOL", () => {
  it("has more than one question, so a reroll always has something to switch to", () => {
    expect(QUESTION_POOL.length).toBeGreaterThan(1);
  });

  it("every question is well-formed and has a unique id", () => {
    QUESTION_POOL.forEach(expectValidQuestion);
    const ids = QUESTION_POOL.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("pickRandomQuestion", () => {
  it("returns a question from the pool", () => {
    const question = pickRandomQuestion();
    expect(QUESTION_POOL).toContainEqual(question);
  });

  it("never returns the excluded question, across repeated draws", () => {
    const excludeId = QUESTION_POOL[0].id;
    for (let i = 0; i < 25; i++) {
      expect(pickRandomQuestion(excludeId).id).not.toBe(excludeId);
    }
  });
});
