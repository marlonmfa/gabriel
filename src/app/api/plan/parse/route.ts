import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { updateSession } from '@/lib/session-store';
import type { StudyModule, StudyPlan } from '@/types';

function parseMarkdownToModules(markdown: string): StudyModule[] {
  const modules: StudyModule[] = [];
  const moduleBlocks = markdown.split(/^## /m).filter(Boolean);

  for (const block of moduleBlocks) {
    const lines = block.trim().split('\n');
    const title = lines[0].replace(/^#+\s*/, '').trim();

    if (title.toLowerCase() === 'next steps') continue;

    const metaLine = lines.find((l) => l.startsWith('**Time:**')) ?? '';
    const timeMatch = metaLine.match(/\*\*Time:\*\*\s*(\d+)/);
    const difficultyMatch = metaLine.match(/\*\*Difficulty:\*\*\s*([\w-]+)/);
    const formatMatch = metaLine.match(/\*\*Format:\*\*\s*([\w-]+)/);

    const concepts = lines
      .filter((l) => l.trim().startsWith('- '))
      .map((l) => l.trim().slice(2).trim())
      .filter(Boolean);

    if (!title || concepts.length === 0) continue;

    modules.push({
      id: nanoid(),
      title,
      concepts,
      estimatedMinutes: timeMatch ? parseInt(timeMatch[1]) : 30,
      difficulty: (difficultyMatch?.[1] as StudyModule['difficulty']) ?? 'core',
      format: (formatMatch?.[1] as StudyModule['format']) ?? 'explanation',
    });
  }

  return modules;
}

export async function POST(req: NextRequest) {
  try {
    const { profileId, userId, rawMarkdown } = await req.json();

    const modules = parseMarkdownToModules(rawMarkdown);
    const totalMinutes = modules.reduce((s, m) => s + m.estimatedMinutes, 0);

    const plan: StudyPlan = {
      userId: userId ?? profileId,
      modules,
      totalDays: Math.ceil(totalMinutes / 60 / 2),
      dailyGoalMinutes: Math.round(totalMinutes / 2),
      generatedAt: new Date().toISOString(),
      rawMarkdown,
    };

    if (profileId) {
      updateSession(profileId, (s) => ({ ...s, plan }));
    }

    return NextResponse.json({ studyPlan: plan });
  } catch (err) {
    return NextResponse.json(
      { error: 'Parse failed', detail: String(err) },
      { status: 400 }
    );
  }
}
