# Gabriel — Architecture

## Overview

Gabriel is a 1-day hackathon MVP for a personalized AI tutoring product. Built on Next.js 14 App Router with Anthropic Claude as the AI engine.

## Design Decisions

### Stack
- **Next.js 14 (App Router)**: Single repo, co-located API routes and UI. One deploy to Vercel.
- **Anthropic Claude claude-opus-4-5**: Powers all tutoring and plan generation. High quality matters for demo credibility.
- **Claude claude-haiku-4-5-20251001**: Used for quiz questions and evaluation (lower latency, cheaper, sufficient quality).
- **Zustand + persist**: Client-side global state with localStorage persistence. No database needed for MVP.
- **shadcn/ui + Tailwind**: Production-quality components in minutes.

### AI Pipeline

**Streaming (SSE):** All conversational AI calls use `text/event-stream`. The blinking cursor during streaming is the product's primary "wow" moment for judges — it signals real-time AI at a glance.

**Tool Use for Quiz Evaluation:** Quiz answers are evaluated using Claude's `tool_use` with `tool_choice: { type: "tool" }` to guarantee structured JSON output. No regex parsing of AI responses.

**Prompt Assembly per Request:** The tutor system prompt is rebuilt on every request, injecting the learner's current style, gap areas, and mastery snapshot. This ensures personalization is always live, not frozen at session start.

### Session State

- `profileId` = `nanoid()` generated at onboarding, stored in Zustand + localStorage
- Server-side: `Map<profileId, ServerSession>` at module scope — survives across requests in one Node.js process
- On Vercel cold starts (empty Map): all routes accept full profile data in the request body as fallback, so no data is lost

### Mastery Tracking

- Represented as `Record<string, number>` (concept slug → 0.0–1.0)
- Quiz phase: populated from `evaluate_answer` tool_use response
- Tutoring phase: +0.1 optimistic increment per exchange, persisted to server via `/api/progress` fire-and-forget

## API Routes

| Route | Method | Streaming | Purpose |
|---|---|---|---|
| `/api/onboard` | POST | No | Create UserProfile, init server session |
| `/api/quiz` | POST | SSE (question) / JSON (eval) | Stream diagnostic question OR evaluate answer |
| `/api/quiz/complete` | POST | No | Build KnowledgeProfile from quiz history |
| `/api/plan` | POST | SSE | Stream study plan markdown |
| `/api/plan/parse` | POST | No | Parse markdown → StudyPlan struct |
| `/api/tutor` | POST | SSE | Stream adaptive tutoring response |
| `/api/progress` | POST | No | Update concept mastery |

## Models Used

| Use Case | Model | Reason |
|---|---|---|
| Tutoring conversation | claude-opus-4-5 | Highest quality, nuanced pedagogical responses |
| Study plan generation | claude-opus-4-5 | Needs broad curriculum knowledge |
| Quiz questions | claude-haiku-4-5-20251001 | Low latency, simpler task |
| Quiz evaluation | claude-haiku-4-5-20251001 | Short structured output via tool_use |

## User Flow

```
/ (Landing)
  → /onboard (Goal + Hours + Style)
      → /quiz (5-question diagnostic, conversational)
          → /plan (Streaming plan generation → module cards)
              → /session?module=N (Split-panel tutoring)
```

## Demo Mode

Add `?demo=true` to any page URL. On `/onboard?demo=true`, the form auto-fills with:
- Topic: "Calculus — derivatives and integrals"
- Goal: "Understand fundamentals for my university exam"
- Hours: 2
- Style: Example-Based

This lets judges see the full product without typing anything.

## Environment Variables

```
ANTHROPIC_API_KEY=   # Required — Anthropic API key
```

## Deployment

```bash
npx vercel --prod
# Set ANTHROPIC_API_KEY in Vercel project settings → Environment Variables
```
