import { z } from 'zod';

export const OnboardSchema = z.object({
  topic: z.string().min(1),
  goal: z.string().min(1),
  lifeGoal: z.string().optional(),
  availableHoursPerDay: z.number().min(0.5).max(12),
  learnerStyle: z.enum(['visual', 'textual', 'example-based', 'audio', 'mixed']),
  urgency: z.enum(['relaxed', 'moderate', 'urgent']).default('moderate'),
  hasADHD: z.boolean().default(false),
});

export const QuizSchema = z.object({
  profileId: z.string(),
  profile: z.object({
    topic: z.string(),
    goal: z.string(),
    learnerStyle: z.string(),
  }),
  userAnswer: z.string().optional(),
  conceptIndex: z.number().default(0),
  concept: z.string().optional(),
});

export const QuizCompleteSchema = z.object({
  profileId: z.string(),
  quizHistory: z.array(
    z.object({
      questionId: z.string(),
      concept: z.string(),
      question: z.string(),
      userAnswer: z.string(),
      evaluation: z.enum(['correct', 'partial', 'incorrect']),
      masteryScore: z.number(),
      feedbackGiven: z.string(),
    })
  ),
});

export const PlanSchema = z.object({
  profileId: z.string(),
  profile: z.object({
    topic: z.string(),
    goal: z.string(),
    lifeGoal: z.string().optional(),
    availableHoursPerDay: z.number(),
    learnerStyle: z.string(),
    urgency: z.enum(['relaxed', 'moderate', 'urgent']).optional(),
    hasADHD: z.boolean().optional(),
  }),
  gapAreas: z.array(z.string()),
  strengthAreas: z.array(z.string()),
});

export const TutorSchema = z.object({
  profileId: z.string(),
  moduleId: z.string(),
  moduleTitle: z.string(),
  concepts: z.array(z.string()),
  message: z.string(),
  history: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    })
  ),
  profile: z.object({
    topic: z.string(),
    goal: z.string(),
    lifeGoal: z.string().optional(),
    learnerStyle: z.string(),
    urgency: z.enum(['relaxed', 'moderate', 'urgent']).optional(),
    hasADHD: z.boolean().optional(),
    gapAreas: z.array(z.string()).optional(),
  }),
  conceptMastery: z.record(z.string(), z.number()).optional(),
});

export const ProgressSchema = z.object({
  profileId: z.string(),
  moduleId: z.string(),
  conceptMastery: z.record(z.string(), z.number()),
  minutesStudied: z.number().optional(),
});

export const ChallengeSchema = z.object({
  profileId: z.string(),
});

export const ChallengeCompleteSchema = z.object({
  profileId: z.string(),
  challengeId: z.string(),
});

export const AudioSummarySchema = z.object({
  profileId: z.string(),
  text: z.string().min(1).max(4000),
});
