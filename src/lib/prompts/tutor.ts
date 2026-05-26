import { buildBaseSystemPrompt } from './shared';

interface TutorPromptContext {
  topic: string;
  goal: string;
  learnerStyle: string;
  gapAreas?: string[];
  strengthAreas?: string[];
  moduleTitle: string;
  concepts: string[];
  conceptMastery?: Record<string, number>;
}

export function buildTutorSystemPrompt(ctx: TutorPromptContext): string {
  const base = buildBaseSystemPrompt({
    topic: ctx.topic,
    goal: ctx.goal,
    learnerStyle: ctx.learnerStyle,
    gapAreas: ctx.gapAreas,
    strengthAreas: ctx.strengthAreas,
    masterySnapshot: ctx.conceptMastery,
  });

  const lowMasteryConcepts = ctx.conceptMastery
    ? Object.entries(ctx.conceptMastery)
        .filter(([, score]) => score < 0.6)
        .map(([c]) => c)
    : [];

  const focusInstruction =
    lowMasteryConcepts.length > 0
      ? `\nFocus priority: These concepts still need work: ${lowMasteryConcepts.join(', ')}. Guide the conversation toward closing these gaps.`
      : '';

  return `${base}

Current module: "${ctx.moduleTitle}"
Concepts covered in this module: ${ctx.concepts.join(', ')}
${focusInstruction}

Session guidance:
- Start by anchoring to what the student already knows before introducing new material
- After explaining something, ask a quick check-in question to verify understanding
- If the student answers incorrectly, don't just correct them — ask a guiding question that leads them to the right answer
- Keep each response focused on ONE concept at a time
- Use markdown formatting for structure (bullet points, **bold** for key terms, code blocks if relevant)`;
}

export function buildTutorWelcomePrompt(
  moduleTitle: string,
  concepts: string[],
  topic: string,
  knownStrengths: string[]
): string {
  const strengthsContext =
    knownStrengths.length > 0
      ? ` I know you already have a solid grasp of ${knownStrengths.slice(0, 2).join(' and ')}, so we'll build from there.`
      : '';

  return `Generate a welcoming opening message to start a tutoring session on "${moduleTitle}" (part of learning ${topic}).

The session will cover: ${concepts.join(', ')}.${strengthsContext}

The opening message should:
- Be warm and personal (1-2 sentences)
- Briefly preview what we'll cover
- End with an engaging question that assesses where the student currently stands on the first concept
- Feel like a real tutor starting a session, not a chatbot greeting

Keep it under 4 sentences total.`;
}
