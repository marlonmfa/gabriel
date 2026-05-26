import { buildBaseSystemPrompt } from './shared';

interface TutorPromptContext {
  topic: string;
  goal: string;
  lifeGoal?: string;
  learnerStyle: string;
  urgency?: string;
  hasADHD?: boolean;
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
    lifeGoal: ctx.lifeGoal,
    learnerStyle: ctx.learnerStyle,
    urgency: ctx.urgency,
    hasADHD: ctx.hasADHD,
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
      ? `\nFocus priority: These concepts still need work: ${lowMasteryConcepts.join(', ')}. Guide toward closing these gaps.`
      : '';

  const adhdSessionGuide = ctx.hasADHD
    ? `\nADHD session rules: After every explanation, give one tiny concrete task ("Try calculating X"). Never ask more than one question per message. Use ✓ checkmarks when the student gets something right.`
    : '';

  return `${base}

Current module: "${ctx.moduleTitle}"
Concepts: ${ctx.concepts.join(', ')}
${focusInstruction}${adhdSessionGuide}

Session guidance:
- Anchor to what the student already knows before introducing new material
- After explaining something, ask ONE check-in question
- If the student is wrong, ask a guiding question — don't just correct
- Use markdown: **bold** key terms, code blocks where relevant
- Keep each response focused on ONE concept`;
}

export function buildTutorWelcomePrompt(
  moduleTitle: string,
  concepts: string[],
  topic: string,
  lifeGoal: string | undefined,
  knownStrengths: string[],
  hasADHD: boolean,
  urgency: string,
): string {
  const lifeContext = lifeGoal
    ? ` I know your goal is: "${lifeGoal}" — everything we cover today connects to that.`
    : '';
  const strengthsContext =
    knownStrengths.length > 0
      ? ` You already know ${knownStrengths.slice(0, 2).join(' and ')}, so we'll build from there.`
      : '';
  const adhdNote = hasADHD ? ' We\'ll keep each piece short and focused — one idea at a time.' : '';
  const urgencyNote = urgency === 'urgent' ? ' I\'ll keep things direct and practical — no fluff.' : '';

  return `Generate a welcoming opening message to start a tutoring session on "${moduleTitle}" (part of learning ${topic}).${lifeContext}

The session will cover: ${concepts.join(', ')}.${strengthsContext}${adhdNote}${urgencyNote}

The opening should:
- Be warm and personal (2-3 sentences max)
- Briefly preview what we'll cover
- End with an engaging question about the first concept
- Feel like a real tutor, not a chatbot

Keep it under 4 sentences total.`;
}
