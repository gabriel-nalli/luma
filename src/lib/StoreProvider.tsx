"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { supabase, LUMA_USER_ID } from "./supabase";
// Inline types and helpers to avoid circular dependency

interface Subject { id: string; name: string; color: string; icon: string; createdAt: string; }
interface StudyPlanStep { id: string; label: string; icon: string; completed: boolean; }
interface StudyPlan { id: string; subjectId: string; title: string; steps: StudyPlanStep[]; createdAt: string; }
interface Note { id: string; subjectId: string; title: string; content: string; createdAt: string; updatedAt: string; }
interface Question { id: string; subjectId: string; studyPlanId?: string; question: string; options?: string[]; correctAnswer: string; explanation: string; userAnswer?: string; isCorrect?: boolean; }
interface Achievement { id: string; title: string; description: string; icon: string; unlockedAt?: string; requirement: { type: string; count: number }; }
interface Reminder { id: string; subjectId?: string; title: string; date: string; done: boolean; }
interface SlideFile { id: string; subjectId: string; fileName: string; dataUrl: string; textContent: string; summary?: string; generatedQuestions?: Question[]; generatedSchedule?: StudyPlanStep[]; createdAt: string; }
interface AppState { subjects: Subject[]; studyPlans: StudyPlan[]; notes: Note[]; questions: Question[]; achievements: Achievement[]; reminders: Reminder[]; slides: SlideFile[]; streak: { current: number; lastStudyDate: string }; }

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  { id: "ach_primeira_estrela", title: "Primeira Estrela", description: "Complete 1 step", icon: "star", requirement: { type: "steps_completed", count: 1 } },
  { id: "ach_estudante_dedicada", title: "Estudante Dedicada", description: "Complete 5 steps", icon: "medal", requirement: { type: "steps_completed", count: 5 } },
  { id: "ach_maratonista", title: "Maratonista", description: "7 day streak", icon: "flame", requirement: { type: "streak_days", count: 7 } },
];

const DEFAULT_STATE: AppState = {
  subjects: [], studyPlans: [], notes: [], questions: [],
  achievements: DEFAULT_ACHIEVEMENTS, reminders: [], slides: [],
  streak: { current: 0, lastStudyDate: "" },
};

interface StoreContextType {
  state: AppState;
  loaded: boolean;
  addSubject: (s: Omit<Subject, "id" | "createdAt">) => Promise<void>;
  updateSubject: (id: string, patch: Partial<Omit<Subject, "id" | "createdAt">>) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;
  addStudyPlan: (p: Omit<StudyPlan, "id" | "createdAt">) => Promise<void>;
  updateStudyPlan: (id: string, patch: Partial<Omit<StudyPlan, "id" | "createdAt">>) => Promise<void>;
  toggleStep: (planId: string, stepId: string) => Promise<void>;
  addNote: (n: Omit<Note, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  updateNote: (id: string, patch: Partial<Omit<Note, "id" | "createdAt">>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  addQuestion: (q: Omit<Question, "id">) => Promise<void>;
  answerQuestion: (id: string, answer: string) => Promise<void>;
  addReminder: (r: Omit<Reminder, "id">) => void;
  toggleReminder: (id: string) => void;
  deleteReminder: (id: string) => void;
  addSlide: (s: Omit<SlideFile, "id" | "createdAt">, file?: File) => Promise<void>;
  updateSlide: (id: string, patch: Partial<Omit<SlideFile, "id" | "createdAt">>) => Promise<void>;
  deleteSlide: (id: string) => Promise<void>;
  checkStreak: () => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [loaded, setLoaded] = useState(false);
  const loadedRef = useRef(false);
  const uid = LUMA_USER_ID;

  // Load once on mount
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    (async () => {
      try {
        const [subjectsRes, notesRes, questionsRes, schedulesRes, stepsRes, attemptsRes] = await Promise.all([
          supabase.from("subjects").select("*").eq("user_id", uid).order("created_at"),
          supabase.from("notes").select("*").eq("user_id", uid).order("created_at"),
          supabase.from("questions").select("*").eq("user_id", uid),
          supabase.from("schedules").select("*").eq("user_id", uid).order("created_at"),
          supabase.from("schedule_steps").select("*, schedules!inner(user_id)").eq("schedules.user_id", uid).order("position"),
          supabase.from("question_attempts").select("*").eq("user_id", uid),
        ]);

        const subjects = (subjectsRes.data || []).map((s: any) => ({ id: s.id, name: s.name, color: s.color, icon: s.icon || "book", createdAt: s.created_at }));
        const notes = (notesRes.data || []).map((n: any) => ({ id: n.id, subjectId: n.subject_id, title: n.title, content: n.content || "", createdAt: n.created_at, updatedAt: n.updated_at || n.created_at }));

        const stepsMap: Record<string, StudyPlanStep[]> = {};
        for (const step of (stepsRes.data || [])) {
          if (!stepsMap[step.schedule_id]) stepsMap[step.schedule_id] = [];
          stepsMap[step.schedule_id].push({ id: step.id, label: step.content, icon: "read", completed: step.completed || false });
        }
        const studyPlans = (schedulesRes.data || []).map((s: any) => ({ id: s.id, subjectId: s.subject_id, title: s.title, steps: stepsMap[s.id] || [], createdAt: s.created_at }));

        const attemptsMap: Record<string, { answer: string; correct: boolean }> = {};
        for (const a of (attemptsRes.data || [])) attemptsMap[a.question_id] = { answer: a.answer, correct: a.correct };
        const questions = (questionsRes.data || []).map((q: any) => {
          const attempt = attemptsMap[q.id];
          return { id: q.id, subjectId: q.subject_id || q.pdf_id || "", question: q.content, options: q.options || [], correctAnswer: q.correct_answer, explanation: q.explanation || "", userAnswer: attempt?.answer, isCorrect: attempt?.correct };
        });

        const { data: pdfsData } = await supabase.from("pdfs").select("*").eq("user_id", uid).order("uploaded_at");
        const slides = (pdfsData || []).map((p: any) => ({ id: p.id, subjectId: p.subject_id, fileName: p.original_name, dataUrl: p.file_path || "", textContent: p.extracted_text || "", summary: typeof p.summary === "string" ? p.summary : p.summary?.text || undefined, generatedQuestions: p.generated_questions || undefined, generatedSchedule: p.generated_schedule || undefined, createdAt: p.uploaded_at }));

        let reminders: Reminder[] = [];
        try { const raw = localStorage.getItem("luma_reminders"); if (raw) reminders = JSON.parse(raw); } catch {}

        const { data: statsRow } = await supabase.from("user_stats").select("*").eq("user_id", uid).maybeSingle();
        const streak = { current: statsRow?.current_streak || 0, lastStudyDate: statsRow?.last_active_date || "" };

        setState({ subjects, studyPlans, notes, questions, achievements: DEFAULT_ACHIEVEMENTS, reminders, slides, streak });
        setLoaded(true);

        // Track daily login
        const today = new Date().toISOString().slice(0, 10);
        if (statsRow && statsRow.last_active_date !== today) {
          const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
          const newStreak = statsRow.last_active_date === yesterday ? (statsRow.current_streak || 0) + 1 : 1;
          await supabase.from("user_stats").update({ current_streak: newStreak, longest_streak: Math.max(newStreak, statsRow.longest_streak || 0), last_active_date: today }).eq("user_id", uid);
          setState((s) => ({ ...s, streak: { current: newStreak, lastStudyDate: today } }));
        } else if (!statsRow) {
          await supabase.from("user_stats").insert({ user_id: uid, current_streak: 1, longest_streak: 1, last_active_date: today });
          setState((s) => ({ ...s, streak: { current: 1, lastStudyDate: today } }));
        }
      } catch {
        setLoaded(true);
      }
    })();
  }, [uid]);

  // Save reminders to localStorage
  useEffect(() => {
    if (loaded) try { localStorage.setItem("luma_reminders", JSON.stringify(state.reminders)); } catch {}
  }, [state.reminders, loaded]);

  const addSubject = useCallback(async (subject: Omit<Subject, "id" | "createdAt">) => {
    const { data } = await supabase.from("subjects").insert({ user_id: uid, name: subject.name, color: subject.color, icon: subject.icon }).select().single();
    if (data) setState((s) => ({ ...s, subjects: [...s.subjects, { id: data.id, name: data.name, color: data.color, icon: data.icon, createdAt: data.created_at }] }));
  }, [uid]);

  const updateSubject = useCallback(async (id: string, patch: Partial<Omit<Subject, "id" | "createdAt">>) => {
    await supabase.from("subjects").update(patch).eq("id", id);
    setState((s) => ({ ...s, subjects: s.subjects.map((sub) => sub.id === id ? { ...sub, ...patch } : sub) }));
  }, []);

  const deleteSubject = useCallback(async (id: string) => {
    await supabase.from("subjects").delete().eq("id", id);
    setState((s) => ({ ...s, subjects: s.subjects.filter((sub) => sub.id !== id), studyPlans: s.studyPlans.filter((p) => p.subjectId !== id), notes: s.notes.filter((n) => n.subjectId !== id), slides: s.slides.filter((sl) => sl.subjectId !== id) }));
  }, []);

  const addStudyPlan = useCallback(async (plan: Omit<StudyPlan, "id" | "createdAt">) => {
    const { data } = await supabase.from("schedules").insert({ user_id: uid, subject_id: plan.subjectId, title: plan.title }).select().single();
    if (data) {
      const stepsToInsert = plan.steps.map((step, i) => ({ schedule_id: data.id, position: i, content: step.label, completed: false }));
      const { data: stepsData } = await supabase.from("schedule_steps").insert(stepsToInsert).select();
      const newPlan: StudyPlan = { id: data.id, subjectId: plan.subjectId, title: plan.title, createdAt: data.created_at, steps: (stepsData || []).map((s: any) => ({ id: s.id, label: s.content, icon: "read", completed: false })) };
      setState((s) => ({ ...s, studyPlans: [...s.studyPlans, newPlan] }));
    }
  }, [uid]);

  const updateStudyPlan = useCallback(async (id: string, patch: Partial<Omit<StudyPlan, "id" | "createdAt">>) => {
    if (patch.title) await supabase.from("schedules").update({ title: patch.title }).eq("id", id);
    setState((s) => ({ ...s, studyPlans: s.studyPlans.map((p) => p.id === id ? { ...p, ...patch } : p) }));
  }, []);

  const toggleStep = useCallback(async (planId: string, stepId: string) => {
    setState((prev) => {
      const updated = prev.studyPlans.map((plan) => {
        if (plan.id !== planId) return plan;
        return { ...plan, steps: plan.steps.map((step) => step.id === stepId ? { ...step, completed: !step.completed } : step) };
      });
      const step = updated.find((p) => p.id === planId)?.steps.find((s) => s.id === stepId);
      if (step) supabase.from("schedule_steps").update({ completed: step.completed, completed_at: step.completed ? new Date().toISOString() : null }).eq("id", stepId);
      return { ...prev, studyPlans: updated };
    });
  }, []);

  const addNote = useCallback(async (note: Omit<Note, "id" | "createdAt" | "updatedAt">) => {
    const { data } = await supabase.from("notes").insert({ user_id: uid, subject_id: note.subjectId, title: note.title, content: note.content }).select().single();
    if (data) setState((s) => ({ ...s, notes: [...s.notes, { id: data.id, subjectId: data.subject_id, title: data.title, content: data.content || "", createdAt: data.created_at, updatedAt: data.updated_at || data.created_at }] }));
  }, [uid]);

  const updateNote = useCallback(async (id: string, patch: Partial<Omit<Note, "id" | "createdAt">>) => {
    const dbPatch: any = { updated_at: new Date().toISOString() };
    if (patch.title) dbPatch.title = patch.title;
    if (patch.content !== undefined) dbPatch.content = patch.content;
    if (patch.subjectId) dbPatch.subject_id = patch.subjectId;
    await supabase.from("notes").update(dbPatch).eq("id", id);
    setState((s) => ({ ...s, notes: s.notes.map((n) => n.id === id ? { ...n, ...patch, updatedAt: dbPatch.updated_at } : n) }));
  }, []);

  const deleteNote = useCallback(async (id: string) => {
    await supabase.from("notes").delete().eq("id", id);
    setState((s) => ({ ...s, notes: s.notes.filter((n) => n.id !== id) }));
  }, []);

  const addQuestion = useCallback(async (question: Omit<Question, "id">) => {
    const { data } = await supabase.from("questions").insert({ user_id: uid, subject_id: question.subjectId, type: "multiple_choice", content: question.question, options: question.options, correct_answer: question.correctAnswer, explanation: question.explanation }).select().single();
    if (data) setState((s) => ({ ...s, questions: [...s.questions, { id: data.id, subjectId: data.subject_id, question: data.content, options: data.options, correctAnswer: data.correct_answer, explanation: data.explanation || "" }] }));
  }, [uid]);

  const answerQuestion = useCallback(async (id: string, userAnswer: string) => {
    setState((prev) => {
      const q = prev.questions.find((q) => q.id === id);
      if (!q) return prev;
      const isCorrect = userAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
      supabase.from("question_attempts").insert({ question_id: id, user_id: uid, answer: userAnswer, correct: isCorrect });
      return { ...prev, questions: prev.questions.map((q) => q.id === id ? { ...q, userAnswer, isCorrect } : q) };
    });
  }, [uid]);

  const addReminder = useCallback((reminder: Omit<Reminder, "id">) => {
    setState((s) => ({ ...s, reminders: [...s.reminders, { ...reminder, id: generateId() }] }));
  }, []);

  const toggleReminder = useCallback((id: string) => {
    setState((s) => ({ ...s, reminders: s.reminders.map((r) => r.id === id ? { ...r, done: !r.done } : r) }));
  }, []);

  const deleteReminder = useCallback((id: string) => {
    setState((s) => ({ ...s, reminders: s.reminders.filter((r) => r.id !== id) }));
  }, []);

  const addSlide = useCallback(async (slide: Omit<SlideFile, "id" | "createdAt">, file?: File) => {
    try {
      const safeName = slide.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = `${uid}/${Date.now()}_${safeName}`;

      // Convert to ArrayBuffer for reliable upload on all platforms (Android included)
      let arrayBuffer: ArrayBuffer;
      if (file) {
        arrayBuffer = await file.arrayBuffer();
      } else if (slide.dataUrl.startsWith("data:")) {
        const base64 = slide.dataUrl.split(",")[1];
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        arrayBuffer = bytes.buffer;
      } else {
        console.error("addSlide: no file or dataUrl"); return;
      }

      const { error: uploadError } = await supabase.storage.from("luma-pdfs").upload(filePath, arrayBuffer, { contentType: "application/pdf", upsert: true });
      if (uploadError) { console.error("Upload error:", uploadError); return; }
      const { data: urlData } = supabase.storage.from("luma-pdfs").getPublicUrl(filePath);
      const publicUrl = urlData?.publicUrl || "";
      const { data, error: insertError } = await supabase.from("pdfs").insert({ user_id: uid, subject_id: slide.subjectId, file_path: publicUrl, original_name: slide.fileName, extracted_text: slide.textContent, processing_status: "done" }).select().single();
      if (insertError) { console.error("Insert error:", insertError); return; }
      if (data) setState((s) => ({ ...s, slides: [...s.slides, { id: data.id, subjectId: data.subject_id, fileName: data.original_name, dataUrl: publicUrl, textContent: data.extracted_text || "", createdAt: data.uploaded_at }] }));
    } catch (err) {
      console.error("addSlide error:", err);
    }
  }, [uid]);

  const updateSlide = useCallback(async (id: string, patch: Partial<Omit<SlideFile, "id" | "createdAt">>) => {
    const dbPatch: any = {};
    if (patch.summary !== undefined) dbPatch.summary = patch.summary;
    if (patch.generatedQuestions !== undefined) dbPatch.generated_questions = patch.generatedQuestions;
    if (patch.generatedSchedule !== undefined) dbPatch.generated_schedule = patch.generatedSchedule;
    if (Object.keys(dbPatch).length > 0) await supabase.from("pdfs").update(dbPatch).eq("id", id);
    setState((s) => ({ ...s, slides: s.slides.map((sl) => sl.id === id ? { ...sl, ...patch } : sl) }));
  }, []);

  const deleteSlide = useCallback(async (id: string) => {
    setState((prev) => {
      const slide = prev.slides.find((s) => s.id === id);
      if (slide?.dataUrl) {
        const path = slide.dataUrl.split("/luma-pdfs/")[1];
        if (path) supabase.storage.from("luma-pdfs").remove([decodeURIComponent(path)]);
      }
      supabase.from("pdfs").delete().eq("id", id);
      return { ...prev, slides: prev.slides.filter((sl) => sl.id !== id) };
    });
  }, []);

  const checkStreak = useCallback(() => {}, []);

  return (
    <StoreContext.Provider value={{ state, loaded, addSubject, updateSubject, deleteSubject, addStudyPlan, updateStudyPlan, toggleStep, addNote, updateNote, deleteNote, addQuestion, answerQuestion, addReminder, toggleReminder, deleteReminder, addSlide, updateSlide, deleteSlide, checkStreak }}>
      {children}
    </StoreContext.Provider>
  );
}
