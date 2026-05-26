'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  UserProfile,
  KnowledgeProfile,
  StudyPlan,
  LearningSession,
  ChatMessage,
  QuizTurn,
} from '@/types';

interface GabrielStore {
  profileId: string | null;
  userProfile: UserProfile | null;
  knowledgeProfile: KnowledgeProfile | null;
  studyPlan: StudyPlan | null;
  activeModuleIndex: number;
  activeSession: LearningSession | null;
  quizHistory: QuizTurn[];

  setProfileId: (id: string) => void;
  setProfile: (p: UserProfile) => void;
  setKnowledge: (k: KnowledgeProfile) => void;
  setPlan: (p: StudyPlan) => void;
  setActiveModuleIndex: (i: number) => void;
  startSession: (moduleId: string) => void;
  addMessage: (msg: ChatMessage) => void;
  updateMastery: (concept: string, score: number) => void;
  addQuizTurn: (turn: QuizTurn) => void;
  reset: () => void;
}

const initialState = {
  profileId: null,
  userProfile: null,
  knowledgeProfile: null,
  studyPlan: null,
  activeModuleIndex: 0,
  activeSession: null,
  quizHistory: [],
};

export const useGabriel = create<GabrielStore>()(
  persist(
    (set) => ({
      ...initialState,

      setProfileId: (id) => set({ profileId: id }),

      setProfile: (p) => set({ userProfile: p }),

      setKnowledge: (k) => set({ knowledgeProfile: k }),

      setPlan: (p) => set({ studyPlan: p }),

      setActiveModuleIndex: (i) => set({ activeModuleIndex: i }),

      startSession: (moduleId) =>
        set((state) => ({
          activeSession: {
            id: crypto.randomUUID(),
            userId: state.profileId ?? '',
            moduleId,
            messages: [],
            conceptMastery: {},
            startedAt: new Date().toISOString(),
            lastActivityAt: new Date().toISOString(),
          },
        })),

      addMessage: (msg) =>
        set((state) => ({
          activeSession: state.activeSession
            ? {
                ...state.activeSession,
                messages: [...state.activeSession.messages, msg],
                lastActivityAt: new Date().toISOString(),
              }
            : state.activeSession,
        })),

      updateMastery: (concept, score) =>
        set((state) => ({
          activeSession: state.activeSession
            ? {
                ...state.activeSession,
                conceptMastery: {
                  ...state.activeSession.conceptMastery,
                  [concept]: score,
                },
              }
            : state.activeSession,
        })),

      addQuizTurn: (turn) =>
        set((state) => ({ quizHistory: [...state.quizHistory, turn] })),

      reset: () => set(initialState),
    }),
    {
      name: 'gabriel-session',
    }
  )
);
