interface PlanPromptContext {
  topic: string;
  goal: string;
  availableHoursPerDay: number;
  learnerStyle: string;
  gapAreas: string[];
  strengthAreas: string[];
}

export function buildPlanPrompt(ctx: PlanPromptContext): string {
  const gapList = ctx.gapAreas.length > 0 ? ctx.gapAreas.join(', ') : 'none identified';
  const strengthList = ctx.strengthAreas.length > 0 ? ctx.strengthAreas.join(', ') : 'none identified';
  const totalMinutesPerDay = Math.round(ctx.availableHoursPerDay * 60);

  return `You are Gabriel, an expert AI curriculum designer. Create a personalized study plan.

Student profile:
- Topic: ${ctx.topic}
- Goal: ${ctx.goal}
- Available time: ${ctx.availableHoursPerDay} hours/day (${totalMinutesPerDay} min/day)
- Learning style: ${ctx.learnerStyle}
- Knowledge gaps: ${gapList}
- Strong areas (skip basics, build on these): ${strengthList}

Generate a structured study plan in this EXACT markdown format. Do not deviate from the format.

Start with a brief personalized introduction (2-3 sentences).

Then for each module use this structure:
## [Module Title]
**Time:** [X] minutes | **Difficulty:** [foundation/core/advanced] | **Format:** [explanation/examples/practice/visual-walkthrough]
- Concept 1
- Concept 2
- Concept 3

Rules:
- Create 3-5 modules total, ordered from gaps → core → advanced
- Each module should be 20-45 minutes
- Focus modules on the identified gaps: ${gapList}
- Skip or briefly mention strong areas: ${strengthList}
- The total plan should fit within 2-3 days at their pace
- End with a "## Next Steps" section with 2-3 motivating sentences`;
}
