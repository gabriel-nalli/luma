"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore, getPerformanceStats, getStreakData } from "@/lib/store";
import BottomNav from "@/components/layout/BottomNav";
import PandaHome from "@/components/mascot/PandaHome";
import StepQuiz from "@/components/ui/StepQuiz";
import { usePushNotifications } from "@/hooks/usePushNotifications";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Bom Dia";
  if (hour >= 12 && hour < 18) return "Boa Tarde";
  return "Boa Noite";
}

interface PerfStat {
  subjectId: string;
  subjectName: string;
  subjectColor: string;
  correct: number;
  wrong: number;
  total: number;
}

function getVerdict(correct: number, total: number): { text: string; color: string } {
  const pct = total > 0 ? correct / total : 0;
  if (pct >= 0.8) return { text: "Excelente! Continue assim", color: "#34d399" };
  if (pct >= 0.6) return { text: "Bom, mas pode melhorar", color: "#fbbf24" };
  if (pct >= 0.4) return { text: "Precisa revisar mais", color: "#fb923c" };
  return { text: "Estude mais esse conteudo", color: "#fb7185" };
}

export default function HomePage() {
  const router = useRouter();
  const { state, loaded, toggleStep } = useStore();
  const [greeting, setGreeting] = useState("Boa Noite");
  const [streak, setStreak] = useState({ current: 0, longest: 0 });
  const [performance, setPerformance] = useState<PerfStat[]>([]);
  const [animatedBars, setAnimatedBars] = useState(false);
  const { permission, loading: pushLoading, requestPermission } = usePushNotifications();
  const [pushDismissed, setPushDismissed] = useState(true);

  useEffect(() => {
    // Check if already dismissed before
    const dismissed = localStorage.getItem("luma_push_dismissed");
    if (dismissed || (typeof Notification !== "undefined" && Notification.permission !== "default")) return;
    // Show after 4 seconds
    const timer = setTimeout(() => setPushDismissed(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

  useEffect(() => {
    if (!loaded) return;
    getStreakData().then(setStreak);
    getPerformanceStats().then((data) => {
      setPerformance(data);
      setTimeout(() => setAnimatedBars(true), 300);
    });
  }, [loaded]);

  // Active schedules (not 100% complete)
  const activeSchedules = state.studyPlans.filter((p) => {
    const done = p.steps.filter((s) => s.completed).length;
    return done < p.steps.length;
  });

  // Today + next upcoming reminders (not done)
  const today = new Date().toISOString().slice(0, 10);
  const upcomingReminders = state.reminders
    .filter((r) => !r.done)
    .sort((a, b) => a.date.localeCompare(b.date))
    .filter((r) => r.date >= today)
    .slice(0, 3);

  // Expanded schedule + quiz
  const [expandedSchedule, setExpandedSchedule] = useState<string | null>(null);
  const [quizStep, setQuizStep] = useState<{ planId: string; stepId: string; label: string; subjectName: string } | null>(null);

  function handleQuizResult(passed: boolean) {
    if (!quizStep) return;
    if (passed) {
      toggleStep(quizStep.planId, quizStep.stepId);
    }
    setQuizStep(null);
  }


  return (
    <main className="w-full max-w-2xl mx-auto relative z-10 pb-36 p-6 md:p-12">
      <div className="space-y-5">
        {/* Header */}
        <header className="mb-6 fade-in-up flex justify-between items-center relative">
          <div>
            <h2 className="text-xs font-semibold tracking-widest text-white/50 uppercase mb-1">{greeting}</h2>
            <h1 className="text-5xl font-extrabold tracking-tight mb-2">
              <span className="text-gradient floating-name">Emily</span>
            </h1>
            <p className="text-white/60 font-light text-sm mt-2">Sou <span className="font-semibold text-[#a78bfa]">Luma</span>, sua assistente de estudos pessoal</p>
          </div>
          <PandaHome />
        </header>

        {/* Push notification banner */}
        {loaded && permission === "default" && !pushDismissed && (
          <section className="rounded-2xl p-4 fade-in-up delay-1 flex items-center gap-3" style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.25)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(139,92,246,0.2)" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-white/80">Ative as notificacoes</p>
              <p className="text-[10px] text-white/40">Lembretes de estudo e avisos de aula</p>
            </div>
            <button onClick={requestPermission} disabled={pushLoading} className="px-3 py-1.5 rounded-lg text-[11px] font-bold shrink-0" style={{ background: "#8b5cf6", color: "#fff" }}>
              {pushLoading ? "..." : "Ativar"}
            </button>
            <button onClick={() => { setPushDismissed(true); localStorage.setItem("luma_push_dismissed", "1"); }} className="text-white/20 hover:text-white/50 shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </section>
        )}

        {!loaded && (
          <div className="space-y-4 fade-in-up delay-1">
            <div className="glass-panel rounded-2xl p-5 h-20 animate-pulse" />
            <div className="glass-panel rounded-2xl p-5 h-32 animate-pulse" />
            <div className="glass-panel rounded-2xl p-5 h-24 animate-pulse" />
          </div>
        )}

        {/* Proximos Lembretes */}
        {loaded && upcomingReminders.length > 0 && (
          <section className="glass-panel rounded-2xl p-5 fade-in-up delay-1">
            <h3 className="text-[10px] font-semibold tracking-widest text-white/50 uppercase mb-3">Proximos Lembretes</h3>
            <div className="space-y-2">
              {upcomingReminders.map((r) => {
                const subject = state.subjects.find((s) => s.id === r.subjectId);
                return (
                  <div key={r.id} className="flex items-center gap-3 py-1.5">
                    <div className="w-[6px] h-[6px] rounded-full" style={{ background: subject?.color || "#8b5cf6", boxShadow: `0 0 6px ${subject?.color || "#8b5cf6"}` }} />
                    <span className="text-xs flex-1 text-white/70">{r.title}</span>
                    <span className="text-[10px] text-white/30 shrink-0">{r.date.includes(today) ? "Hoje" : new Date(r.date).toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Performance Graph */}
        {loaded && (
          <section className="glass-panel rounded-2xl p-5 fade-in-up delay-2">
            <h3 className="text-[10px] font-semibold tracking-widest text-white/50 uppercase mb-4">Performance por Materia</h3>
            {performance.length === 0 && (
              <p className="text-white/30 text-xs text-center py-4">Responda questoes das suas materias pra ver seu desempenho aqui</p>
            )}
            <div className="space-y-4 max-h-[35vh] overflow-y-auto">
              {performance.map((stat, i) => {
                const pct = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;
                const verdict = getVerdict(stat.correct, stat.total);
                return (
                  <div key={stat.subjectId} style={{ animationDelay: `${i * 0.1}s` }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: stat.subjectColor }} />
                        <span className="text-xs font-semibold text-white/80">{stat.subjectName}</span>
                      </div>
                      <span className="text-[11px] font-bold" style={{ color: verdict.color }}>{pct}%</span>
                    </div>

                    {/* Animated bar */}
                    <div className="h-3 rounded-full overflow-hidden relative" style={{ background: "rgba(255,255,255,0.05)" }}>
                      {/* Correct bar */}
                      <div
                        className="h-full rounded-full absolute left-0 top-0 transition-all duration-1000 ease-out"
                        style={{
                          width: animatedBars ? `${pct}%` : "0%",
                          background: `linear-gradient(90deg, ${stat.subjectColor}, ${stat.subjectColor}cc)`,
                          boxShadow: animatedBars ? `0 0 12px ${stat.subjectColor}66` : "none",
                          transitionDelay: `${i * 150}ms`,
                        }}
                      />
                      {/* Glow tip */}
                      {animatedBars && pct > 5 && (
                        <div
                          className="absolute top-0 h-full w-3 rounded-full transition-all duration-1000 ease-out"
                          style={{
                            left: `calc(${pct}% - 6px)`,
                            background: "#fff",
                            boxShadow: `0 0 8px #fff, 0 0 16px ${stat.subjectColor}`,
                            opacity: 0.8,
                            transitionDelay: `${i * 150}ms`,
                          }}
                        />
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-white/30">{stat.correct} acertos / {stat.wrong} erros</span>
                      <span className="text-[10px] font-medium" style={{ color: verdict.color }}>{verdict.text}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Active Schedules */}
        {activeSchedules.length > 0 && (
          <section className="glass-panel rounded-2xl p-5 fade-in-up delay-3">
            <h3 className="text-[10px] font-semibold tracking-widest text-white/50 uppercase mb-3">Cronogramas Ativos</h3>
            <div className="space-y-3 max-h-[40vh] overflow-y-auto">
              {activeSchedules.map((plan) => {
                const subject = state.subjects.find((s) => s.id === plan.subjectId);
                const done = plan.steps.filter((s) => s.completed).length;
                const total = plan.steps.length;
                const pct = total > 0 ? (done / total) * 100 : 0;
                const isExpanded = expandedSchedule === plan.id;
                const nextStep = plan.steps.find((s) => !s.completed);

                return (
                  <div key={plan.id}>
                    <div
                      className="cursor-pointer group"
                      onClick={() => setExpandedSchedule(isExpanded ? null : plan.id)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: subject?.color || "#8b5cf6" }} />
                          <span className="text-xs font-medium text-white/70 group-hover:text-white transition-colors truncate max-w-[200px]">{plan.title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-white/40">{done}/{total}</span>
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={`text-white/20 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}><path d="M6 9l6 6 6-6" /></svg>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                        <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${pct}%`, background: subject?.color || "#8b5cf6" }} />
                      </div>
                    </div>

                    {/* Expanded: all steps with scroll */}
                    {isExpanded && (
                      <div className="mt-2 rounded-xl max-h-[35vh] overflow-y-auto" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        {plan.steps.map((step) => (
                          <div key={step.id} className="flex items-center gap-3 px-3 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                            {step.completed ? (
                              <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.4)" }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                              </div>
                            ) : (
                              <button
                                onClick={(e) => { e.stopPropagation(); setQuizStep({ planId: plan.id, stepId: step.id, label: step.label, subjectName: subject?.name || "" }); }}
                                className="w-5 h-5 rounded-full shrink-0 transition-colors hover:border-[#8b5cf6]"
                                style={{ border: "1.5px solid rgba(255,255,255,0.15)", background: "transparent" }}
                              />
                            )}
                            <span className={`text-xs flex-1 ${step.completed ? "line-through text-white/30" : "text-white/70"}`}>{step.label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Streak */}
        {loaded && <section className="glass-panel rounded-2xl p-5 flex justify-between items-center fade-in-up delay-4 group cursor-default">
          <div>
            <h3 className="text-[10px] font-semibold tracking-widest text-white/50 uppercase mb-1">Sequencia de Estudos</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-gradient-gold drop-shadow-[0_0_15px_rgba(251,191,36,0.2)]">
                {streak.current} {streak.current === 1 ? "dia" : "dias"}
              </span>
            </div>
            <p className="text-[11px] text-white/40 mt-0.5">
              {streak.current === 0 ? "Acesse todo dia pra comecar sua sequencia" :
               streak.current >= 7 ? "Incrivel! Voce e imparavel" :
               streak.current >= 3 ? "Continue assim, nao perca o ritmo" :
               "Bom comeco! Mantenha a consistencia"}
            </p>
          </div>
          <div className="streak-icon-box w-14 h-14 rounded-xl flex items-center justify-center relative">
            <div className="absolute inset-0 rounded-xl bg-yellow-400 opacity-20 blur-md animate-pulse" />
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="rgba(251,191,36,0.25)" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="relative z-10 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)] group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
            </svg>
          </div>
        </section>}

        {/* Empty state if no data */}
        {loaded && performance.length === 0 && activeSchedules.length === 0 && (
          <section className="glass-panel rounded-2xl p-6 fade-in-up delay-2 text-center">
            <p className="text-white/40 text-sm mb-3">Comece adicionando materias e subindo seus slides</p>
            <button onClick={() => router.push("/materias")} className="px-5 py-2 rounded-lg text-sm font-semibold" style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)", color: "#a78bfa" }}>
              Ir para Materias
            </button>
          </section>
        )}
      </div>

      {/* Step Quiz */}
      <StepQuiz
        open={!!quizStep}
        topic={quizStep?.label || ""}
        subjectName={quizStep?.subjectName || ""}
        onClose={() => setQuizStep(null)}
        onResult={handleQuizResult}
      />

      <BottomNav />
    </main>
  );
}
