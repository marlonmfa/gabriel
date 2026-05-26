interface PlanPromptContext {
  topic: string;
  goal: string;
  lifeGoal?: string;
  availableHoursPerDay: number;
  learnerStyle: string;
  urgency?: string;
  hasADHD?: boolean;
  gapAreas: string[];
  strengthAreas: string[];
}

export function buildPlanPrompt(ctx: PlanPromptContext): string {
  const gapList = ctx.gapAreas.length > 0 ? ctx.gapAreas.join(', ') : 'none identified';
  const strengthList = ctx.strengthAreas.length > 0 ? ctx.strengthAreas.join(', ') : 'none identified';
  const totalMinutesPerDay = Math.round(ctx.availableHoursPerDay * 60);

  const lifeGoalContext = ctx.lifeGoal
    ? `\n- Life/career goal: "${ctx.lifeGoal}" — all modules should feel directly relevant to this ambition.`
    : '';

  const adhdContext = ctx.hasADHD
    ? '\n- ADHD adaptation: Each module must be max 20 minutes. Use active, hands-on formats. No module should be pure reading/explanation — always mix in a challenge or quiz.'
    : '';

  const urgencyContext =
    ctx.urgency === 'urgent'
      ? '\n- URGENT: Student needs results fast. Create an accelerated plan with only the highest-leverage concepts. 2-3 modules max, each focused on what gets them closest to their goal immediately.'
      : ctx.urgency === 'relaxed'
      ? '\n- RELAXED: Student wants depth. Can create 5 modules with more thorough coverage including advanced topics.'
      : '';

  const formatContext = ctx.learnerStyle === 'audio'
    ? '\n- AUDIO LEARNER: Mark modules with format "audio-narrative". Modules should be structured as narrated explanations, stories, and dialogues rather than text/diagrams.'
    : '';

  return `You are Gabriel, an expert AI curriculum designer specializing in career-focused learning.

Student profile:
- Topic: ${ctx.topic}
- Goal: ${ctx.goal}${lifeGoalContext}
- Available time: ${ctx.availableHoursPerDay} hours/day (${totalMinutesPerDay} min/day)
- Learning style: ${ctx.learnerStyle}
- Knowledge gaps: ${gapList}
- Strong areas (skip basics, build on these): ${strengthList}${adhdContext}${urgencyContext}${formatContext}

Generate a personalized study plan in this EXACT markdown format. Do not deviate.

Start with a brief personalized introduction (2-3 sentences) that connects the topic to their life goal.

Then for each module:
## [Module Title]
**Time:** [X] minutes | **Difficulty:** [foundation/core/advanced] | **Format:** [explanation/examples/practice/visual-walkthrough/audio-narrative]
- Concept 1
- Concept 2
- Concept 3

Rules:
- Create 3-5 modules (or 2-3 if urgency=urgent), ordered from gaps → core → advanced
- Each module 15-40 minutes (15-20 if ADHD)
- Focus on gaps: ${gapList}
- End with a "## Daily Challenge" section: suggest ONE 5-minute daily challenge they can do starting tomorrow`;
}
