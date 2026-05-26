export type LearnerStyle = 'visual' | 'textual' | 'example-based' | 'audio' | 'mixed';
export type UrgencyLevel = 'relaxed' | 'moderate' | 'urgent';

export interface UserProfile {
  id: string;
  topic: string;
  goal: string;
  lifeGoal?: string;          // career/life ambition — "quero virar analista financeiro"
  availableHoursPerDay: number;
  learnerStyle: LearnerStyle;
  urgency: UrgencyLevel;
  hasADHD: boolean;
  createdAt: string;
}

export interface KnowledgeProfile {
  userId: string;
  conceptScores: Record<string, number>;
  strengthAreas: string[];
  gapAreas: string[];
  recommendedStartingPoint: string;
  quizCompletedAt: string;
}

export interface StudyModule {
  id: string;
  title: string;
  concepts: string[];
  estimatedMinutes: number;
  difficulty: 'foundation' | 'core' | 'advanced';
  format: 'explanation' | 'examples' | 'practice' | 'visual-walkthrough' | 'audio-narrative';
}

export interface StudyPlan {
  userId: string;
  modules: StudyModule[];
  totalDays: number;
  dailyGoalMinutes: number;
  generatedAt: string;
  rawMarkdown: string;
}

export interface DailyChallenge {
  id: string;
  profileId: string;
  date: string;                 // ISO date YYYY-MM-DD
  title: string;
  description: string;
  concept: string;
  estimatedMinutes: number;
  completed: boolean;
  completedAt?: string;
  xp: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: {
    conceptAddressed?: string;
    masteryDelta?: number;
  };
}

export interface LearningSession {
  id: string;
  userId: string;
  moduleId: string;
  messages: ChatMessage[];
  conceptMastery: Record<string, number>;
  startedAt: string;
  lastActivityAt: string;
  completedAt?: string;
}

export interface QuizTurn {
  questionId: string;
  concept: string;
  question: string;
  userAnswer: string;
  evaluation: 'correct' | 'partial' | 'incorrect';
  masteryScore: number;
  feedbackGiven: string;
}

export interface EvolutionEntry {
  date: string;
  xpEarned: number;
  conceptsStudied: string[];
  minutesStudied: number;
  challengesCompleted: number;
  sessionsCount: number;
}

export interface ServerSession {
  profile: UserProfile;
  knowledge?: KnowledgeProfile;
  plan?: StudyPlan;
  activeSession?: LearningSession;
  quizHistory: QuizTurn[];
  challenges?: DailyChallenge[];
  evolution?: EvolutionEntry[];
  totalXP?: number;
}
