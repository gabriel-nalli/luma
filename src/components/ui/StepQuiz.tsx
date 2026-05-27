"use client";

import { useState, useEffect } from "react";
import { generateTopicQuiz } from "@/lib/ai";
import Modal from "./Modal";
import ConfettiEffect from "@/components/icons/ConfettiEffect";

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface StepQuizProps {
  open: boolean;
  topic: string;
  subjectName: string;
  onClose: () => void;
  onResult: (passed: boolean, score: number) => void;
}

export default function StepQuiz({ open, topic, subjectName, onClose, onResult }: StepQuizProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answers, setAnswers] = useState<{ correct: boolean }[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  useEffect(() => {
    if (!open) return;
    setQuestions([]);
    setCurrentIndex(0);
    setSelected(null);
    setAnswers([]);
    setShowResult(false);
    setShowExplanation(false);
    setLoading(true);

    generateTopicQuiz(topic, subjectName).then((qs) => {
      setQuestions(qs);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [open, topic, subjectName]);

  const currentQ = questions[currentIndex];
  const score = answers.filter((a) => a.correct).length;
  const total = answers.length;

  function handleSelect(opt: string) {
    if (showExplanation) return;
    setSelected(opt);
  }

  function handleConfirm() {
    if (!selected || !currentQ) return;
    const isCorrect = selected.trim().toLowerCase() === currentQ.correctAnswer.trim().toLowerCase();
    setAnswers([...answers, { correct: isCorrect }]);
    setShowExplanation(true);
    if (isCorrect) {
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 1500);
    }
  }

  function handleNext() {
    if (currentIndex + 1 >= questions.length) {
      setShowResult(true);
      const finalScore = answers.filter((a) => a.correct).length;
      if (finalScore >= 4) { setCelebrate(true); setTimeout(() => setCelebrate(false), 2000); }
    } else {
      setCurrentIndex(currentIndex + 1);
      setSelected(null);
      setShowExplanation(false);
    }
  }

  function handleFinish() {
    const finalScore = answers.filter((a) => a.correct).length;
    const passed = finalScore >= 7;
    onResult(passed, finalScore);
  }

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} fullscreen>
      <ConfettiEffect trigger={celebrate} />
      {celebrate && (
        <div className="fixed inset-0 z-[300] flex flex-col items-center justify-center pointer-events-none" style={{ animation: "fadeInUp 0.6s cubic-bezier(0.1, 0.8, 0.2, 1) both" }}>
          <div className="w-28 h-28 mb-3">
            <svg viewBox="0 0 100 100" overflow="visible" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_10px_30px_rgba(139,92,246,0.6)]">
              <g style={{ animation: "pandaBob 1.5s ease-in-out infinite" }}>
                <circle cx="20" cy="24" r="15" fill="#2a2540" stroke="#6d5e99" strokeWidth="1.5" />
                <circle cx="80" cy="24" r="15" fill="#2a2540" stroke="#6d5e99" strokeWidth="1.5" />
                <circle cx="30" cy="72" r="13" fill="#2a2540" stroke="#6d5e99" strokeWidth="1.5" />
                <circle cx="70" cy="72" r="13" fill="#2a2540" stroke="#6d5e99" strokeWidth="1.5" />
                <ellipse cx="50" cy="48" rx="38" ry="34" fill="#ffffff" />
                <ellipse cx="32" cy="42" rx="10" ry="10" fill="#1f1c2e" />
                <ellipse cx="68" cy="42" rx="10" ry="10" fill="#1f1c2e" />
                <path d="M28 42 Q32 37 36 42" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M64 42 Q68 37 72 42" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" />
                <ellipse cx="50" cy="56" rx="6.5" ry="4" fill="#1f1c2e" />
                <path d="M38 60 Q50 72 62 60" fill="none" stroke="#1f1c2e" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="24" cy="54" r="5" fill="#fbcfe8" opacity="0.4" />
                <circle cx="76" cy="54" r="5" fill="#fbcfe8" opacity="0.4" />
              </g>
              <path d="M15,5 Q15,10 10,10 Q15,10 15,15 Q15,10 20,10 Q15,10 15,5 Z" fill="#fbbf24" className="sparkle-1" />
              <path d="M85,8 Q85,14 79,14 Q85,14 85,20 Q85,14 91,14 Q85,14 85,8 Z" fill="#fbbf24" className="sparkle-2" />
            </svg>
          </div>
          <p className="text-xl font-extrabold text-white drop-shadow-[0_0_20px_rgba(139,92,246,0.5)]">Parabens!</p>
        </div>
      )}
      <div className="flex items-center justify-between mb-4">
        <button onClick={onClose} className="text-white/50 hover:text-white transition-colors text-sm flex items-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          Sair
        </button>
        {!showResult && questions.length > 0 && (
          <span className="text-xs text-white/40">{currentIndex + 1}/{questions.length}</span>
        )}
      </div>

      {loading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="w-8 h-8 border-2 border-[#8b5cf6] border-t-transparent rounded-full animate-spin" />
          <div className="text-center px-6">
            <p className="text-white/70 text-sm font-semibold mb-1">Preparando seu quiz</p>
            <p className="text-white/30 text-xs leading-relaxed">{topic}</p>
          </div>
        </div>
      )}

      {!loading && questions.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <p className="text-white/40 text-sm">Nao foi possivel gerar o quiz. Tente novamente.</p>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm" style={{ background: "#8b5cf6", color: "#fff" }}>Voltar</button>
        </div>
      )}

      {/* Quiz in progress */}
      {!loading && !showResult && currentQ && (
        <div className="flex-1 flex flex-col">
          {/* Progress bar */}
          <div className="h-1 rounded-full mb-6 overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%`, background: "linear-gradient(90deg, #8b5cf6, #a78bfa)" }} />
          </div>

          <h3 className="text-lg font-bold text-white mb-6 leading-relaxed">{currentQ.question}</h3>

          <div className="space-y-2.5 flex-1">
            {currentQ.options.map((opt) => {
              let bg = "rgba(255,255,255,0.04)";
              let border = "rgba(255,255,255,0.08)";

              if (showExplanation) {
                if (opt.trim().toLowerCase() === currentQ.correctAnswer.trim().toLowerCase()) {
                  bg = "rgba(52,211,153,0.15)";
                  border = "#34d399";
                } else if (opt === selected) {
                  bg = "rgba(251,113,133,0.15)";
                  border = "#fb7185";
                }
              } else if (opt === selected) {
                bg = "rgba(139,92,246,0.15)";
                border = "#8b5cf6";
              }

              return (
                <button
                  key={opt}
                  onClick={() => handleSelect(opt)}
                  disabled={showExplanation}
                  className="w-full text-left px-4 py-3 rounded-xl text-sm transition-all"
                  style={{ background: bg, border: `1px solid ${border}`, color: "#fff" }}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {showExplanation && (
            <div className="mt-4 p-3 rounded-xl text-xs" style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}>
              <span className="font-semibold text-[#a78bfa]">Explicacao: </span>
              {currentQ.explanation}
            </div>
          )}

          <div className="mt-4">
            {!showExplanation ? (
              <button onClick={handleConfirm} disabled={!selected} className="w-full py-3 rounded-xl text-sm font-bold transition-colors" style={{ background: selected ? "#8b5cf6" : "rgba(255,255,255,0.06)", color: selected ? "#fff" : "rgba(255,255,255,0.3)" }}>
                Confirmar
              </button>
            ) : (
              <button onClick={handleNext} className="w-full py-3 rounded-xl text-sm font-bold" style={{ background: "#8b5cf6", color: "#fff" }}>
                {currentIndex + 1 >= questions.length ? "Ver Resultado" : "Proxima"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Result */}
      {showResult && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          {/* Score circle */}
          <div className="relative w-32 h-32">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="42" fill="none"
                stroke={score >= 7 ? "#34d399" : score >= 4 ? "#fbbf24" : "#fb7185"}
                strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${(score / 10) * 264} 264`}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-black text-white">{score}/10</span>
            </div>
          </div>

          <h2 className="text-xl font-bold text-white">
            {score >= 7 ? "Muito bem!" : score >= 4 ? "Quase la!" : "Precisa estudar mais"}
          </h2>

          <p className="text-sm text-white/50 text-center max-w-xs">
            {score >= 7
              ? "Voce dominou esse topico. Check liberado!"
              : score >= 4
              ? "Bom resultado, mas revise os pontos que errou. Check liberado com alerta."
              : "Voce acertou menos de 4 questoes. Estude mais esse topico antes de continuar. Check bloqueado."}
          </p>

          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)" }}>
              <span className="text-xs font-bold text-[#34d399]">{score} acertos</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: "rgba(251,113,133,0.1)", border: "1px solid rgba(251,113,133,0.2)" }}>
              <span className="text-xs font-bold text-[#fb7185]">{10 - score} erros</span>
            </div>
          </div>

          <button onClick={handleFinish} className="w-full max-w-xs py-3 rounded-xl text-sm font-bold mt-4" style={{ background: score >= 4 ? "#8b5cf6" : "rgba(255,255,255,0.06)", color: score >= 4 ? "#fff" : "rgba(255,255,255,0.5)" }}>
            {score >= 4 ? "Concluir" : "Voltar e estudar mais"}
          </button>
        </div>
      )}
    </Modal>
  );
}
