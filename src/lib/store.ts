"use client";

import { supabase, LUMA_USER_ID } from "./supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Subject { id: string; name: string; color: string; icon: string; createdAt: string; }
export interface StudyPlanStep { id: string; label: string; icon: string; completed: boolean; }
export interface StudyPlan { id: string; subjectId: string; title: string; steps: StudyPlanStep[]; createdAt: string; }
export interface Note { id: string; subjectId: string; title: string; content: string; createdAt: string; updatedAt: string; }
export interface Question { id: string; subjectId: string; studyPlanId?: string; question: string; options?: string[]; correctAnswer: string; explanation: string; userAnswer?: string; isCorrect?: boolean; }
export interface Achievement { id: string; title: string; description: string; icon: string; unlockedAt?: string; requirement: { type: string; count: number }; }
export interface Reminder { id: string; subjectId?: string; title: string; date: string; done: boolean; }
export interface SlideFile { id: string; subjectId: string; fileName: string; dataUrl: string; textContent: string; summary?: string; generatedQuestions?: Question[]; generatedSchedule?: StudyPlanStep[]; createdAt: string; }
export interface AppState { subjects: Subject[]; studyPlans: StudyPlan[]; notes: Note[]; questions: Question[]; achievements: Achievement[]; reminders: Reminder[]; slides: SlideFile[]; streak: { current: number; lastStudyDate: string }; }

// ─── Utilities ────────────────────────────────────────────────────────────────

export function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  { id: "ach_primeira_estrela", title: "Primeira Estrela", description: "Complete 1 step", icon: "star", requirement: { type: "steps_completed", count: 1 } },
  { id: "ach_estudante_dedicada", title: "Estudante Dedicada", description: "Complete 5 steps", icon: "medal", requirement: { type: "steps_completed", count: 5 } },
  { id: "ach_maratonista", title: "Maratonista", description: "7 day streak", icon: "flame", requirement: { type: "streak_days", count: 7 } },
];

// ─── Re-export useStore from provider ─────────────────────────────────────────

export { useStore } from "./StoreProvider";

// ─── Performance stats helpers ────────────────────────────────────────────────

export async function getPerformanceStats() {
  const uid = LUMA_USER_ID;
  const { data: attempts } = await supabase.from("question_attempts").select("correct, questions(subject_id)").eq("user_id", uid);
  const { data: subjects } = await supabase.from("subjects").select("id, name, color").eq("user_id", uid);
  if (!attempts || !subjects) return [];

  const map: Record<string, { correct: number; wrong: number }> = {};
  for (const a of attempts) {
    const sid = (a as any).questions?.subject_id;
    if (!sid) continue;
    if (!map[sid]) map[sid] = { correct: 0, wrong: 0 };
    if (a.correct) map[sid].correct++; else map[sid].wrong++;
  }

  return subjects.map((s: any) => ({
    subjectId: s.id, subjectName: s.name, subjectColor: s.color,
    correct: map[s.id]?.correct || 0, wrong: map[s.id]?.wrong || 0,
    total: (map[s.id]?.correct || 0) + (map[s.id]?.wrong || 0),
  })).filter((s) => s.total > 0);
}

export async function getStreakData() {
  const uid = LUMA_USER_ID;
  const { data } = await supabase.from("user_stats").select("current_streak, longest_streak").eq("user_id", uid).single();
  return { current: data?.current_streak || 0, longest: data?.longest_streak || 0 };
}
