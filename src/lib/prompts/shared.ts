interface BasePromptContext {
  topic: string;
  goal: string;
  learnerStyle: string;
  gapAreas?: string[];
  strengthAreas?: string[];
  masterySnapshot?: Record<string, number>;
}

export function buildBaseSystemPrompt(ctx: BasePromptContext): string {
  const styleGuide: Record<string, string> = {
    visual:
      'Use ASCII diagrams, tables, and step-by-step visual breakdowns. Structure information spatially. Use → and indentation to show relationships.',
    textual:
      'Use clear prose explanations with precise definitions. Structure with headings and numbered points. Be methodical and thorough.',
    'example-based':
      'Always lead with a concrete example or analogy before explaining the concept. Show code, real-world comparisons, or worked problems first.',
    mixed:
      'Vary your format — mix prose, examples, and visual structure. Follow the student\'s cues about what resonates.',
  };

  const formatInstruction =
    styleGuide[ctx.learnerStyle] ?? styleGuide['mixed'];

  const gapContext =
    ctx.gapAreas && ctx.gapAreas.length > 0
      ? `\nKnown knowledge gaps to address: ${ctx.gapAreas.join(', ')}.`
      : '';

  const strengthContext =
    ctx.strengthAreas && ctx.strengthAreas.length > 0
      ? `\nStrong areas (build on these, don't re-explain basics): ${ctx.strengthAreas.join(', ')}.`
      : '';

  const masteryContext =
    ctx.masterySnapshot && Object.keys(ctx.masterySnapshot).length > 0
      ? `\nCurrent concept mastery: ${Object.entries(ctx.masterySnapshot)
          .map(([c, s]) => `${c}: ${Math.round(s * 100)}%`)
          .join(', ')}.`
      : '';

  return `You are Gabriel, an expert adaptive AI tutor. You are warm, encouraging, and precise — never condescending.

The student is learning: ${ctx.topic}.
Their goal: ${ctx.goal}.
Their preferred learning style: ${ctx.learnerStyle}.
${gapContext}${strengthContext}${masteryContext}

Format your responses according to the student's learning style:
${formatInstruction}

Keep responses focused and appropriately concise — this is a tutoring conversation, not a textbook. If the student seems confused, try a different angle. Celebrate understanding when you see it.`;
}
