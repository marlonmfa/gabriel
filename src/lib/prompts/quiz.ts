// Concepts to probe, derived from topic context — Claude will adapt to the actual topic
export const QUIZ_CONCEPTS = [
  'foundational understanding',
  'core mechanics',
  'practical application',
  'edge cases and nuance',
  'connections to related ideas',
];

export function buildQuizQuestionPrompt(
  topic: string,
  concept: string,
  previousTurns: Array<{ question: string; answer: string }>
): string {
  const priorContext =
    previousTurns.length > 0
      ? `\nPrevious questions asked:\n${previousTurns.map((t) => `- ${t.question}`).join('\n')}`
      : '';

  return `You are conducting a diagnostic quiz to assess a student's knowledge of: ${topic}.

You are now probing their understanding of: "${concept}".
${priorContext}

Ask ONE diagnostic question that:
- Is conversational, not test-like (avoid "Question 1:" framing)
- Targets "${concept}" specifically
- Is open-ended enough to reveal depth of understanding
- Is at an appropriate difficulty — not trivially easy, not intimidatingly hard

Ask only the question. No preamble, no "Sure!", no explanation. Just the question itself.`;
}

export function buildQuizEvalPrompt(
  topic: string,
  concept: string,
  question: string,
  userAnswer: string
): string {
  return `You are evaluating a student's diagnostic quiz answer about: ${topic}.

Concept being tested: "${concept}"
Question asked: "${question}"
Student's answer: "${userAnswer}"

Evaluate the answer and respond with the evaluate_answer tool.
Be generous — partial understanding should score 0.4–0.6. A blank or "I don't know" scores 0.0.
Keep feedback to one encouraging sentence that hints at the correct direction without giving it away entirely.`;
}

// Tool schema for structured evaluation — guarantees parseable JSON
export const EVALUATE_ANSWER_TOOL = {
  name: 'evaluate_answer',
  description: 'Evaluate a student answer to a diagnostic quiz question',
  input_schema: {
    type: 'object' as const,
    properties: {
      score: {
        type: 'number',
        description: 'Mastery score from 0.0 (no understanding) to 1.0 (complete mastery)',
      },
      evaluation: {
        type: 'string',
        enum: ['correct', 'partial', 'incorrect'],
        description: 'Overall evaluation of the answer',
      },
      feedback: {
        type: 'string',
        description:
          'One sentence of constructive, encouraging feedback that hints at the right direction',
      },
    },
    required: ['score', 'evaluation', 'feedback'],
  },
};
