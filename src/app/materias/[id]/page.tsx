"use client";

import { useState, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/lib/store";
import type { SlideFile } from "@/lib/store";
import GlassCard from "@/components/ui/GlassCard";
import BottomNav from "@/components/layout/BottomNav";
import AnimatedCheck from "@/components/icons/AnimatedCheck";
import ConfettiEffect from "@/components/icons/ConfettiEffect";
import PdfPreview from "@/components/ui/PdfPreview";
import DrawingPreview from "@/components/ui/DrawingPreview";
import Markdown from "react-markdown";
import DrawingCanvas from "@/components/ui/DrawingCanvas";
import Modal from "@/components/ui/Modal";
import StepQuiz from "@/components/ui/StepQuiz";

type Tab = "Cronogramas" | "Notas" | "Questoes" | "Slides";

export default function SubjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { state, toggleStep, addNote, updateNote, deleteNote, answerQuestion, addSlide, updateSlide, deleteSlide, addStudyPlan, addQuestion } = useStore();

  const subject = state.subjects.find((s) => s.id === id);
  const plans = state.studyPlans.filter((p) => p.subjectId === id);
  const notes = state.notes.filter((n) => n.subjectId === id);
  const questions = state.questions.filter((q) => q.subjectId === id);
  const slides = state.slides.filter((s) => s.subjectId === id);

  const [activeTab, setActiveTab] = useState<Tab>("Cronogramas");
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [confettiPlan, setConfettiPlan] = useState<string | null>(null);

  // Notes editor
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteMode, setNoteMode] = useState<"text" | "draw">("text");
  const [drawingStrokes, setDrawingStrokes] = useState<any[]>([]);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [viewingNote, setViewingNote] = useState<typeof notes[0] | null>(null);

  // Quiz state
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Celebration state
  const [showCelebration, setShowCelebration] = useState(false);

  // Slides state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [expandedSlide, setExpandedSlide] = useState<string | null>(null);
  const [generatingFor, setGeneratingFor] = useState<{ id: string; type: string } | null>(null);
  const pdfBase64Cache = useRef<Record<string, string>>({});

  // Step quiz state
  const [quizStep, setQuizStep] = useState<{ planId: string; stepId: string; label: string } | null>(null);

  function handleToggleStep(planId: string, stepId: string) {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;
    const step = plan.steps.find((s) => s.id === stepId);
    if (!step) return;

    // If already completed, allow unchecking without quiz
    if (step.completed) {
      toggleStep(planId, stepId);
      return;
    }

    // Open quiz before allowing check
    setQuizStep({ planId, stepId, label: step.label });
  }

  function handleQuizResult(passed: boolean, score: number) {
    if (!quizStep) return;
    if (passed) {
      toggleStep(quizStep.planId, quizStep.stepId);

      // Check if all steps done -> confetti
      const plan = plans.find((p) => p.id === quizStep.planId);
      if (plan) {
        const othersDone = plan.steps.filter((s) => s.id !== quizStep.stepId).every((s) => s.completed);
        if (othersDone) {
          setConfettiPlan(quizStep.planId);
          setTimeout(() => setConfettiPlan(null), 2000);
        }
      }
    }
    setQuizStep(null);
  }

  function openNoteEditor(note?: typeof notes[0]) {
    if (note) {
      setEditingNoteId(note.id);
      setNoteTitle(note.title);
      try {
        const parsed = JSON.parse(note.content);
        if (parsed._type === "drawing") {
          setNoteMode("draw");
          setDrawingStrokes(parsed.strokes || []);
          setNoteContent("");
        } else {
          setNoteMode("text");
          setNoteContent(note.content);
          setDrawingStrokes([]);
        }
      } catch {
        setNoteMode("text");
        setNoteContent(note.content);
        setDrawingStrokes([]);
      }
    } else {
      setEditingNoteId(null);
      setNoteTitle("");
      setNoteContent("");
      setNoteMode("text");
      setDrawingStrokes([]);
    }
    setNoteModalOpen(true);
  }

  function handleSaveNote() {
    if (!noteTitle.trim()) return;
    const content = noteMode === "draw"
      ? JSON.stringify({ _type: "drawing", strokes: drawingStrokes })
      : noteContent;

    if (editingNoteId) {
      updateNote(editingNoteId, { title: noteTitle.trim(), content, subjectId: id });
    } else {
      addNote({ subjectId: id, title: noteTitle.trim(), content });
    }
    setNoteModalOpen(false);
  }

  function handleDeleteNote() {
    if (!editingNoteId) return;
    deleteNote(editingNoteId);
    setNoteModalOpen(false);
  }

  function handleSubmitAnswer(questionId: string) {
    if (!selectedOption) return;
    answerQuestion(questionId, selectedOption);
    setSubmitted(true);

    // Check if correct
    const q = questions.find((q) => q.id === questionId);
    if (q && selectedOption.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3500);
    }
  }

  function openQuestion(qId: string) {
    setActiveQuestion(qId);
    setSelectedOption(null);
    setSubmitted(false);
  }

  async function handlePdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || file.type !== "application/pdf") return;
    setUploadingPdf(true);

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      // Store base64 temporarily for AI calls
      const tempId = `pending_${Date.now()}`;
      pdfBase64Cache.current[file.name] = dataUrl;
      addSlide({
        subjectId: id,
        fileName: file.name,
        dataUrl,
        textContent: "",
      });
      setUploadingPdf(false);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function getPdfBase64(slide: SlideFile): Promise<string> {
    // Check cache first
    if (pdfBase64Cache.current[slide.fileName]) return pdfBase64Cache.current[slide.fileName];
    // If dataUrl is already base64
    if (slide.dataUrl.startsWith("data:")) return slide.dataUrl;
    // Download from storage URL and convert to base64
    const res = await fetch(slide.dataUrl);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  }

  async function handleGenerateSummary(slide: SlideFile) {
    setGeneratingFor({ id: slide.id, type: "summary" });
    try {
      const { generateSummaryAI } = await import("@/lib/ai");
      const source = slide.dataUrl.startsWith("http") ? slide.dataUrl : await getPdfBase64(slide);
      const summary = await generateSummaryAI(source, subject?.name);
      updateSlide(slide.id, { summary });
    } catch (err: any) {
      updateSlide(slide.id, { summary: `Erro: ${err?.message || "falha"}` });
    }
    setGeneratingFor(null);
  }

  async function handleGenerateQuestions(slide: SlideFile) {
    setGeneratingFor({ id: slide.id, type: "questions" });
    try {
      const { generateQuestionsAI } = await import("@/lib/ai");
      const source = slide.dataUrl.startsWith("http") ? slide.dataUrl : await getPdfBase64(slide);
      const raw = await generateQuestionsAI(source, subject?.name);
      if (raw.length === 0) throw new Error("Nenhuma questao gerada");
      for (const q of raw) {
        await addQuestion({
          subjectId: id,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
        });
      }
      updateSlide(slide.id, { generatedQuestions: raw as any });
    } catch (err: any) {
      console.error("Erro ao gerar questoes:", err);
    }
    setGeneratingFor(null);
  }

  async function handleGenerateSchedule(slide: SlideFile) {
    setGeneratingFor({ id: slide.id, type: "schedule" });
    let steps;
    try {
      const { generateScheduleAI } = await import("@/lib/ai");
      const { generateId } = await import("@/lib/store");
      const source = slide.dataUrl.startsWith("http") ? slide.dataUrl : await getPdfBase64(slide);
      const raw = await generateScheduleAI(source, subject?.name);
      if (raw.length === 0) throw new Error("Nenhum cronograma gerado");
      steps = raw.map((s) => ({ id: generateId(), label: s.label, icon: s.icon || "read", completed: false }));
    } catch (err: any) {
      console.error("Erro ao gerar cronograma:", err);
      setGeneratingFor(null);
      return;
    }
    addStudyPlan({
      subjectId: id,
      title: `Cronograma: ${slide.fileName.replace(".pdf", "")}`,
      steps,
    });
    updateSlide(slide.id, { generatedSchedule: steps });
    setGeneratingFor(null);
  }

  const tabs: Tab[] = ["Cronogramas", "Notas", "Questoes", "Slides"];

  if (!subject) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-24" style={{ color: "var(--text-secondary)" }}>
        Materia nao encontrada.
        <BottomNav />
      </div>
    );
  }

  return (
    <main className="w-full max-w-2xl mx-auto relative z-10 pb-36 p-6 md:p-12" style={{ color: "var(--text-primary)" }}>
      <div>
        {/* Back button + Title */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex items-center gap-3 mb-6"
        >
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg flex items-center justify-center"
            style={{
              background: "var(--glass-bg)",
              border: "1px solid var(--glass-border)",
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--text-primary)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ background: subject.color }}
            />
            <h1 className="text-2xl font-bold" style={{ color: subject.color }}>
              {subject.name}
            </h1>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5 p-1 rounded-lg" style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}>
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 py-2 rounded-lg text-sm font-semibold relative transition-colors"
              style={{ color: activeTab === tab ? "#fff" : "var(--text-secondary)" }}
            >
              {activeTab === tab && (
                <motion.div
                  layoutId="tab-bg"
                  className="absolute inset-0 rounded-lg"
                  style={{ background: "var(--accent-purple)" }}
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                />
              )}
              <span className="relative z-10">{tab}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {/* ── Cronogramas ── */}
          {activeTab === "Cronogramas" && (
            <motion.div
              key="cronogramas"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="space-y-3"
            >
              {plans.length === 0 && (
                <p className="text-center py-10" style={{ color: "var(--text-secondary)" }}>
                  Nenhum cronograma para esta materia.
                </p>
              )}

              {plans.map((plan) => {
                const completed = plan.steps.filter((s) => s.completed).length;
                const total = plan.steps.length;
                const progress = total > 0 ? (completed / total) * 100 : 0;
                const isExpanded = expandedPlan === plan.id;

                return (
                  <div key={plan.id}>
                    <ConfettiEffect trigger={confettiPlan === plan.id} />
                    <GlassCard
                      hoverable
                      onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}
                      className="p-4 cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                          {plan.title}
                        </p>
                        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                          {completed}/{total}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: subject.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                      </div>

                      <div className="flex items-center justify-end mt-1.5">
                        <motion.svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="var(--text-secondary)"
                          strokeWidth="2"
                          strokeLinecap="round"
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.25 }}
                        >
                          <path d="M6 9l6 6 6-6" />
                        </motion.svg>
                      </div>
                    </GlassCard>

                    {/* Expanded steps */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-1 rounded-lg overflow-hidden" style={{ border: "1px solid var(--glass-border)" }}>
                            {plan.steps.map((step, si) => (
                              <motion.button
                                key={step.id}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: si * 0.04 }}
                                onClick={() => handleToggleStep(plan.id, step.id)}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                                style={{
                                  background: step.completed ? "rgba(155,123,247,0.07)" : "rgba(255,255,255,0.03)",
                                  borderBottom: si < plan.steps.length - 1 ? "1px solid var(--glass-border)" : "none",
                                }}
                              >
                                <AnimatedCheck size={20} active={step.completed} />
                                <span
                                  className="text-sm flex-1"
                                  style={{
                                    color: step.completed ? "var(--text-secondary)" : "var(--text-primary)",
                                    textDecoration: step.completed ? "line-through" : "none",
                                  }}
                                >
                                  {step.label}
                                </span>
                              </motion.button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* ── Notas ── */}
          {activeTab === "Notas" && (
            <motion.div
              key="notas"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="space-y-3"
            >
              {notes.length === 0 && (
                <p className="text-center py-8" style={{ color: "var(--text-secondary)" }}>
                  Nenhuma nota ainda.
                </p>
              )}

              {notes.map((note, i) => {
                let isDrawing = false;
                let textPreview = note.content || "Sem conteudo";
                try {
                  const p = JSON.parse(note.content);
                  if (p._type === "drawing") isDrawing = true;
                } catch {
                  textPreview = note.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() || "Sem conteudo";
                }
                return (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <GlassCard hoverable onClick={() => isDrawing ? setViewingNote(note) : openNoteEditor(note)} className="p-4 cursor-pointer">
                      <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                        {note.title}
                      </p>
                      {isDrawing ? (
                        <div className="mt-2 rounded-lg overflow-hidden" style={{ background: "rgba(0,0,0,0.2)" }}>
                          <DrawingPreview content={note.content} height={80} />
                        </div>
                      ) : (
                        <p className="text-xs mt-1 line-clamp-2" style={{ color: "var(--text-secondary)" }}>
                          {textPreview}
                        </p>
                      )}
                    </GlassCard>
                  </motion.div>
                );
              })}

              <motion.button
                onClick={() => openNoteEditor()}
                className="w-full py-4 rounded-lg flex items-center justify-center gap-2 font-bold text-sm"
                style={{
                  background: "transparent",
                  border: "1.5px dashed var(--accent-purple)",
                  color: "var(--accent-purple)",
                }}
                whileHover={{ background: "rgba(155,123,247,0.07)" }}
                whileTap={{ scale: 0.98 }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-purple)" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Nova Nota
              </motion.button>
            </motion.div>
          )}

          {/* ── Questoes ── */}
          {activeTab === "Questoes" && (
            <motion.div
              key="questoes"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="space-y-3"
            >
              {questions.length === 0 && (
                <p className="text-center py-10" style={{ color: "var(--text-secondary)" }}>
                  Nenhuma questao para esta materia.
                </p>
              )}

              {questions.map((q, i) => {
                const isOpen = activeQuestion === q.id;
                const answered = q.userAnswer !== undefined;

                return (
                  <motion.div
                    key={q.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <GlassCard
                      hoverable={!isOpen}
                      onClick={!isOpen ? () => openQuestion(q.id) : undefined}
                      className="p-4 cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm flex-1 pr-2" style={{ color: "var(--text-primary)" }}>
                          {q.question}
                        </p>
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                          style={{
                            background: answered
                              ? q.isCorrect
                                ? "rgba(123,224,173,0.15)"
                                : "rgba(244,132,95,0.15)"
                              : "rgba(155,123,247,0.12)",
                            color: answered
                              ? q.isCorrect
                                ? "#7BE0AD"
                                : "#F4845F"
                              : "var(--accent-purple)",
                          }}
                        >
                          {answered ? (q.isCorrect ? "Correto" : "Errado") : "Pendente"}
                        </span>
                      </div>

                      {/* Quiz interface */}
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden mt-3"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {q.options && q.options.length > 0 ? (
                              <div className="space-y-2">
                                {q.options.map((opt) => {
                                  const isSelected = selectedOption === opt || q.userAnswer === opt;
                                  const isCorrectOpt = opt === q.correctAnswer;
                                  let optBg = "rgba(255,255,255,0.04)";
                                  let optBorder = "var(--glass-border)";

                                  if (submitted || q.userAnswer !== undefined) {
                                    if (isCorrectOpt) {
                                      optBg = "rgba(123,224,173,0.12)";
                                      optBorder = "#7BE0AD";
                                    } else if (isSelected && !isCorrectOpt) {
                                      optBg = "rgba(244,132,95,0.12)";
                                      optBorder = "#F4845F";
                                    }
                                  } else if (isSelected) {
                                    optBg = "rgba(155,123,247,0.15)";
                                    optBorder = "var(--accent-purple)";
                                  }

                                  return (
                                    <button
                                      key={opt}
                                      disabled={submitted || q.userAnswer !== undefined}
                                      onClick={() => setSelectedOption(opt)}
                                      className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
                                      style={{
                                        background: optBg,
                                        border: `1px solid ${optBorder}`,
                                        color: "var(--text-primary)",
                                      }}
                                    >
                                      {opt}
                                    </button>
                                  );
                                })}
                              </div>
                            ) : (
                              <input
                                type="text"
                                value={selectedOption ?? ""}
                                onChange={(e) => setSelectedOption(e.target.value)}
                                disabled={submitted || q.userAnswer !== undefined}
                                placeholder="Sua resposta..."
                                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                                style={{
                                  background: "rgba(255,255,255,0.06)",
                                  border: "1px solid var(--glass-border)",
                                  color: "var(--text-primary)",
                                }}
                              />
                            )}

                            {(submitted || q.userAnswer !== undefined) && (
                              <motion.div
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-3 p-3 rounded-lg text-xs"
                                style={{
                                  background: "rgba(155,123,247,0.08)",
                                  border: "1px solid var(--glass-border)",
                                  color: "var(--text-secondary)",
                                }}
                              >
                                <span className="font-semibold" style={{ color: "var(--accent-purple)" }}>
                                  Explicacao:{" "}
                                </span>
                                {q.explanation}
                              </motion.div>
                            )}

                            {!submitted && q.userAnswer === undefined && (
                              <div className="flex gap-2 mt-3">
                                <button
                                  onClick={() => setActiveQuestion(null)}
                                  className="flex-1 py-2 rounded-lg text-xs font-semibold"
                                  style={{
                                    background: "rgba(255,255,255,0.06)",
                                    border: "1px solid var(--glass-border)",
                                    color: "var(--text-secondary)",
                                  }}
                                >
                                  Fechar
                                </button>
                                <button
                                  onClick={() => handleSubmitAnswer(q.id)}
                                  disabled={!selectedOption}
                                  className="flex-1 py-2 rounded-lg text-xs font-bold"
                                  style={{
                                    background: "var(--accent-purple)",
                                    color: "#fff",
                                    opacity: selectedOption ? 1 : 0.45,
                                  }}
                                >
                                  Confirmar
                                </button>
                              </div>
                            )}

                            {(submitted || q.userAnswer !== undefined) && (
                              <button
                                onClick={() => setActiveQuestion(null)}
                                className="w-full mt-3 py-2 rounded-lg text-xs font-semibold"
                                style={{
                                  background: "rgba(255,255,255,0.06)",
                                  border: "1px solid var(--glass-border)",
                                  color: "var(--text-secondary)",
                                }}
                              >
                                Fechar
                              </button>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* ── Slides ── */}
          {activeTab === "Slides" && (
            <motion.div
              key="slides"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="space-y-3"
            >
              {/* Upload button */}
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handlePdfUpload}
              />
              <motion.button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPdf}
                className="w-full py-4 rounded-lg flex items-center justify-center gap-2 font-bold text-sm"
                style={{
                  background: "transparent",
                  border: "1.5px dashed var(--accent-purple)",
                  color: "var(--accent-purple)",
                  opacity: uploadingPdf ? 0.5 : 1,
                }}
                whileHover={{ background: "rgba(155,123,247,0.07)" }}
                whileTap={{ scale: 0.98 }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-purple)" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                </svg>
                {uploadingPdf ? "Processando PDF..." : "Enviar PDF de Slides"}
              </motion.button>

              {slides.length === 0 && !uploadingPdf && (
                <p className="text-center py-8" style={{ color: "var(--text-secondary)" }}>
                  Nenhum slide enviado ainda.
                </p>
              )}

              {slides.map((slide, i) => {
                const isExpanded = expandedSlide === slide.id;
                const isGenerating = generatingFor?.id === slide.id;

                return (
                  <motion.div
                    key={slide.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <GlassCard
                      hoverable={!isExpanded}
                      onClick={() => setExpandedSlide(isExpanded ? null : slide.id)}
                      className="p-4 cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-purple)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                            <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
                          </svg>
                          <p className="font-bold text-sm truncate" style={{ color: "var(--text-primary)" }}>
                            {slide.fileName}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteSlide(slide.id); }}
                            className="p-1 rounded"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                            </svg>
                          </button>
                          <motion.svg
                            width="14" height="14" viewBox="0 0 24 24" fill="none"
                            stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round"
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.25 }}
                          >
                            <path d="M6 9l6 6 6-6" />
                          </motion.svg>
                        </div>
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden mt-3"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* PDF Preview */}
                            <div className="rounded-lg overflow-hidden mb-3" style={{ border: "1px solid var(--glass-border)" }}>
                              <PdfPreview dataUrl={slide.dataUrl} fileName={slide.fileName} />
                            </div>

                            {/* Action Buttons */}
                            <div className="grid grid-cols-3 gap-2 mb-3">
                              <button
                                onClick={() => handleGenerateSummary(slide)}
                                disabled={!!isGenerating}
                                className="py-2.5 px-2 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 transition-colors"
                                style={{
                                  background: slide.summary ? "rgba(123,224,173,0.1)" : "rgba(155,123,247,0.1)",
                                  border: `1px solid ${slide.summary ? "rgba(123,224,173,0.3)" : "var(--glass-border)"}`,
                                  color: slide.summary ? "#7BE0AD" : "var(--accent-purple)",
                                  opacity: isGenerating && generatingFor?.type !== "summary" ? 0.5 : 1,
                                }}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                                  <path d="M14 2v6h6M16 13H8M16 17H8" />
                                </svg>
                                {isGenerating && generatingFor?.type === "summary" ? "Gerando..." : slide.summary ? "Ver Resumo" : "Resumo"}
                              </button>
                              <button
                                onClick={() => handleGenerateQuestions(slide)}
                                disabled={!!isGenerating}
                                className="py-2.5 px-2 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 transition-colors"
                                style={{
                                  background: slide.generatedQuestions ? "rgba(123,224,173,0.1)" : "rgba(155,123,247,0.1)",
                                  border: `1px solid ${slide.generatedQuestions ? "rgba(123,224,173,0.3)" : "var(--glass-border)"}`,
                                  color: slide.generatedQuestions ? "#7BE0AD" : "var(--accent-purple)",
                                  opacity: isGenerating && generatingFor?.type !== "questions" ? 0.5 : 1,
                                }}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                  <circle cx="12" cy="12" r="10" />
                                  <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01" />
                                </svg>
                                {isGenerating && generatingFor?.type === "questions" ? "Gerando..." : slide.generatedQuestions ? "Questoes Criadas" : "Gerar Questoes"}
                              </button>
                              <button
                                onClick={() => handleGenerateSchedule(slide)}
                                disabled={!!isGenerating}
                                className="py-2.5 px-2 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 transition-colors"
                                style={{
                                  background: slide.generatedSchedule ? "rgba(123,224,173,0.1)" : "rgba(155,123,247,0.1)",
                                  border: `1px solid ${slide.generatedSchedule ? "rgba(123,224,173,0.3)" : "var(--glass-border)"}`,
                                  color: slide.generatedSchedule ? "#7BE0AD" : "var(--accent-purple)",
                                  opacity: isGenerating && generatingFor?.type !== "schedule" ? 0.5 : 1,
                                }}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                  <path d="M16 2v4M8 2v4M3 10h18" />
                                </svg>
                                {isGenerating && generatingFor?.type === "schedule" ? "Gerando..." : slide.generatedSchedule ? "Cronograma Criado" : "Cronograma"}
                              </button>
                            </div>

                            {/* Summary display */}
                            {slide.summary && (
                              <motion.div
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-3 rounded-lg text-xs mb-3"
                                style={{
                                  background: "rgba(155,123,247,0.08)",
                                  border: "1px solid var(--glass-border)",
                                  color: "var(--text-secondary)",
                                  whiteSpace: "pre-wrap",
                                }}
                              >
                                <span className="font-semibold block mb-2" style={{ color: "var(--accent-purple)" }}>
                                  Resumo do PDF
                                </span>
                                <div className="prose-sm prose-invert [&_h1]:text-sm [&_h1]:font-bold [&_h1]:text-white/90 [&_h2]:text-sm [&_h2]:font-bold [&_h2]:text-white/90 [&_h3]:text-xs [&_h3]:font-bold [&_h3]:text-white/80 [&_p]:text-xs [&_p]:text-white/60 [&_p]:mb-2 [&_strong]:text-white/80 [&_ul]:text-xs [&_ul]:text-white/60 [&_ul]:ml-3 [&_ol]:text-xs [&_ol]:text-white/60 [&_ol]:ml-3 [&_li]:mb-0.5">
                                  <Markdown>{slide.summary}</Markdown>
                                </div>
                              </motion.div>
                            )}

                            {/* Generated questions info */}
                            {slide.generatedQuestions && (
                              <motion.div
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-3 rounded-lg text-xs mb-3"
                                style={{
                                  background: "rgba(123,224,173,0.08)",
                                  border: "1px solid rgba(123,224,173,0.2)",
                                  color: "#7BE0AD",
                                }}
                              >
                                {slide.generatedQuestions.length} questoes geradas! Veja na aba &quot;Questoes&quot;.
                              </motion.div>
                            )}

                            {/* Generated schedule info */}
                            {slide.generatedSchedule && (
                              <motion.div
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-3 rounded-lg text-xs"
                                style={{
                                  background: "rgba(123,224,173,0.08)",
                                  border: "1px solid rgba(123,224,173,0.2)",
                                  color: "#7BE0AD",
                                }}
                              >
                                Cronograma criado com {slide.generatedSchedule.length} etapas! Veja na aba &quot;Cronogramas&quot;.
                              </motion.div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Visualizar Desenho */}
      <Modal open={!!viewingNote} onClose={() => setViewingNote(null)} fullscreen>
        {viewingNote && (
          <>
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setViewingNote(null)} className="text-white/50 hover:text-white transition-colors text-sm flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                Voltar
              </button>
              <button onClick={() => { openNoteEditor(viewingNote); setViewingNote(null); }} className="text-sm font-bold px-5 py-1.5 rounded-lg" style={{ background: "#8b5cf6", color: "#fff" }}>
                Editar
              </button>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">{viewingNote.title}</h2>
            <div className="flex-1 rounded-xl overflow-y-auto" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <DrawingPreview content={viewingNote.content} height={600} />
            </div>
          </>
        )}
      </Modal>

      {/* Editor de Nota (fullscreen) */}
      <Modal open={noteModalOpen} onClose={() => setNoteModalOpen(false)} fullscreen>
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setNoteModalOpen(false)} className="text-white/50 hover:text-white transition-colors text-sm flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            Voltar
          </button>
          <div className="flex items-center gap-2">
            {editingNoteId && (
              <button onClick={handleDeleteNote} className="text-[#fb7185] text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-[#fb7185]/10 transition-colors">Excluir</button>
            )}
            <button onClick={handleSaveNote} className="text-sm font-bold px-5 py-1.5 rounded-lg" style={{ background: "#8b5cf6", color: "#fff", opacity: noteTitle.trim() ? 1 : 0.4 }}>Salvar</button>
          </div>
        </div>

        {/* Mode toggle */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-white/30 flex-1">{subject?.name}</span>
          <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
            <button onClick={() => setNoteMode("text")} className="px-3 py-2 text-[11px] font-medium transition-colors" style={{ background: noteMode === "text" ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.02)", color: noteMode === "text" ? "#a78bfa" : "rgba(255,255,255,0.3)" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7V4h16v3" /><path d="M9 20h6" /><path d="M12 4v16" /></svg>
            </button>
            <button onClick={() => setNoteMode("draw")} className="px-3 py-2 text-[11px] font-medium transition-colors" style={{ background: noteMode === "draw" ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.02)", color: noteMode === "draw" ? "#a78bfa" : "rgba(255,255,255,0.3)" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
            </button>
          </div>
        </div>

        <input autoFocus type="text" value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} placeholder="Titulo da nota" className="w-full text-2xl font-bold outline-none mb-3 bg-transparent text-white placeholder-white/20" />
        <div className="h-px w-full bg-white/5 mb-3" />

        {noteMode === "text" && (
          <div className="flex-1 relative">
            <textarea value={noteContent} onChange={(e) => setNoteContent(e.target.value)} placeholder="Comece a escrever..." className="flex-1 w-full h-full bg-transparent text-[15px] leading-relaxed outline-none resize-none text-white/80 placeholder-white/20 px-1" />
          </div>
        )}
        {noteMode === "draw" && (
          <DrawingCanvas strokes={drawingStrokes} onChange={setDrawingStrokes} />
        )}
      </Modal>

      {/* Step Quiz */}
      <StepQuiz
        open={!!quizStep}
        topic={quizStep?.label || ""}
        subjectName={subject?.name || ""}
        onClose={() => setQuizStep(null)}
        onResult={handleQuizResult}
      />

      {/* Celebration overlay */}
      <ConfettiEffect trigger={showCelebration} />
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center pointer-events-none"
          >
            <div className="w-32 h-32 mb-4">
              <svg viewBox="0 0 100 100" overflow="visible" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_10px_30px_rgba(139,92,246,0.6)]">
                <g style={{ animation: "pandaBob 1.5s ease-in-out infinite" }}>
                  <circle cx="20" cy="24" r="15" fill="#2a2540" stroke="#6d5e99" strokeWidth="1.5" />
                  <circle cx="80" cy="24" r="15" fill="#2a2540" stroke="#6d5e99" strokeWidth="1.5" />
                  <circle cx="30" cy="72" r="13" fill="#2a2540" stroke="#6d5e99" strokeWidth="1.5" />
                  <circle cx="70" cy="72" r="13" fill="#2a2540" stroke="#6d5e99" strokeWidth="1.5" />
                  <ellipse cx="50" cy="48" rx="38" ry="34" fill="#ffffff" />
                  <ellipse cx="32" cy="42" rx="10" ry="10" fill="#1f1c2e" />
                  <ellipse cx="68" cy="42" rx="10" ry="10" fill="#1f1c2e" />
                  {/* Happy closed eyes */}
                  <path d="M28 42 Q32 37 36 42" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M64 42 Q68 37 72 42" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" />
                  <ellipse cx="50" cy="56" rx="6.5" ry="4" fill="#1f1c2e" />
                  {/* Big smile */}
                  <path d="M38 60 Q50 72 62 60" fill="none" stroke="#1f1c2e" strokeWidth="2.5" strokeLinecap="round" />
                  {/* Blush */}
                  <circle cx="24" cy="54" r="5" fill="#fbcfe8" opacity="0.4" />
                  <circle cx="76" cy="54" r="5" fill="#fbcfe8" opacity="0.4" />
                </g>
                <path d="M15,5 Q15,10 10,10 Q15,10 15,15 Q15,10 20,10 Q15,10 15,5 Z" fill="#fbbf24" className="sparkle-1" />
                <path d="M85,8 Q85,14 79,14 Q85,14 85,20 Q85,14 91,14 Q85,14 85,8 Z" fill="#fbbf24" className="sparkle-2" />
              </svg>
            </div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-extrabold text-white text-center drop-shadow-[0_0_20px_rgba(139,92,246,0.5)]"
            >
              Parabens! 🎉
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-sm text-white/60 mt-1"
            >
              Voce acertou!
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </main>
  );
}
