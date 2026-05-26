export interface UserProfile {
  id: string;
  topic: string;
  goal: string;
  availableHoursPerDay: number;
  learnerStyle: 'visual' | 'textual' | 'example-based' | 'mixed';
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
  format: 'explanation' | 'examples' | 'practice' | 'visual-walkthrough';
}

export interface StudyPlan {
  userId: string;
  modules: StudyModule[];
  totalDays: number;
  dailyGoalMinutes: number;
  generatedAt: string;
  rawMarkdown: string;
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

export interface ServerSession {
  profile: UserProfile;
  knowledge?: KnowledgeProfile;
  plan?: StudyPlan;
  activeSession?: LearningSession;
  quizHistory: QuizTurn[];
}
