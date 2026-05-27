"use client";

import { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import BottomNav from "@/components/layout/BottomNav";
import PandaAgenda from "@/components/mascot/PandaAgenda";
import Modal from "@/components/ui/Modal";

const SUBJECT_COLORS: Record<string, string> = {
  "#9B7BF7": "#a78bfa",
  "#F4845F": "#fb7185",
  "#7BE0AD": "#34d399",
  "#60A5FA": "#60a5fa",
};

const DAYS_HEADER = ["D", "S", "T", "Q", "Q", "S", "S"];

type AgendaFilter = "todos" | "hoje" | "semana";

export default function AgendaPage() {
  const { state, toggleReminder, addReminder } = useStore();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [agendaFilter, setAgendaFilter] = useState<AgendaFilter>("todos");
  const today = now.getDate();
  const isCurrentMonth = month === now.getMonth() && year === now.getFullYear();

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [reminderTitle, setReminderTitle] = useState("");
  const [reminderDate, setReminderDate] = useState("");
  const [reminderSubject, setReminderSubject] = useState("");

  const monthName = new Date(year, month).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [month, year]);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  }

  function handleAddReminder() {
    if (!reminderTitle.trim()) return;
    addReminder({
      title: reminderTitle.trim(),
      date: reminderDate || new Date().toISOString(),
      subjectId: reminderSubject || undefined,
      done: false,
    });
    setReminderTitle("");
    setReminderDate("");
    setReminderSubject("");
    setModalOpen(false);
  }

  const filteredReminders = useMemo(() => {
    if (agendaFilter === "todos") return state.reminders;
    const todayStr = now.toISOString().slice(0, 10);
    if (agendaFilter === "hoje") return state.reminders.filter((r) => r.date.includes(todayStr));
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() + 7);
    return state.reminders.filter((r) => { const d = new Date(r.date); return d >= now && d <= weekEnd; });
  }, [state.reminders, agendaFilter, now]);

  const filterButtons: { key: AgendaFilter; label: string }[] = [
    { key: "todos", label: "Todos" },
    { key: "hoje", label: "Hoje" },
    { key: "semana", label: "Esta semana" },
  ];

  return (
    <main className="w-full max-w-2xl mx-auto relative z-10 pb-36 p-6 md:p-12">
      <div className="space-y-6 pt-8">
        <div className="relative">
          <section className="relative z-10 fade-in-up">
            <div className="mb-5">
              <h2 className="text-3xl font-bold tracking-tight text-white mb-1">Agenda</h2>
              <p className="text-sm text-white/50 font-light">Seus lembretes e revisoes</p>
            </div>

            <div className="relative mb-6">
              <PandaAgenda />
              <div className="glass-panel rounded-[20px] p-6">
                <div className="flex justify-between items-center mb-8 px-2">
                  <button onClick={prevMonth}><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/30 hover:text-white cursor-pointer transition-colors"><polyline points="15 18 9 12 15 6" /></svg></button>
                  <span className="text-[13px] font-semibold text-white/90 tracking-wide capitalize">{monthName}</span>
                  <button onClick={nextMonth}><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/30 hover:text-white cursor-pointer transition-colors"><polyline points="9 18 15 12 9 6" /></svg></button>
                </div>
                <div className="grid grid-cols-7 gap-y-7 gap-x-2 text-center">
                  {DAYS_HEADER.map((d, i) => (<div key={i} className="text-[10px] font-medium text-white/30 uppercase tracking-widest">{d}</div>))}
                  {calendarDays.map((day, i) => {
                    if (day === null) return <div key={`e-${i}`} />;
                    const isToday = isCurrentMonth && day === today;
                    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const hasReminder = state.reminders.some((r) => r.date.includes(dateStr));

                    function handleDayClick() {
                      setReminderDate(dateStr);
                      setReminderTitle("");
                      setReminderSubject("");
                      setModalOpen(true);
                    }

                    return (
                      <div key={day} onClick={handleDayClick} className={`relative flex flex-col items-center justify-center mx-auto cursor-pointer ${isToday ? "w-7 h-7" : "w-7 h-7"} hover:bg-white/5 rounded-full transition-colors`}>
                        {isToday && <div className="absolute inset-0 bg-[#a78bfa] rounded-full shadow-[0_0_15px_rgba(167,139,250,0.6)]" />}
                        <span className={`relative text-xs ${isToday ? "font-bold text-white" : "font-medium text-white/70"}`}>{day}</span>
                        {hasReminder && !isToday && <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-[#a78bfa]" />}
                        {hasReminder && isToday && <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-white" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" } as React.CSSProperties}>
              {filterButtons.map((f) => (
                <button key={f.key} onClick={() => setAgendaFilter(f.key)} className={`px-6 py-2 rounded-full text-[13px] font-medium transition-all shrink-0 ${agendaFilter === f.key ? "bg-[#2e1a4f] border border-[#8b5cf6] text-[#d8b4fe] shadow-[0_0_15px_rgba(139,92,246,0.2)]" : "bg-transparent border border-white/10 text-white/40 hover:bg-white/5 hover:text-white/80"}`}>{f.label}</button>
              ))}
            </div>

            <div className="space-y-3">
              {filteredReminders.length === 0 && <p className="text-center py-8 text-white/40 text-sm">Nenhum lembrete encontrado.</p>}
              {filteredReminders.map((reminder) => {
                const subject = state.subjects.find((s) => s.id === reminder.subjectId);
                const dotColor = subject ? (SUBJECT_COLORS[subject.color] || subject.color) : "#a78bfa";
                return (
                  <div key={reminder.id} className="glass-panel hoverable rounded-[12px] p-4 flex items-center gap-4 cursor-pointer group hover:bg-white/5">
                    <div className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: dotColor, boxShadow: `0 0 8px ${dotColor}` }} />
                    <div className="flex-1 min-w-0 flex flex-col justify-center pt-0.5">
                      <h4 className="text-[13px] font-medium text-white/90 group-hover:text-white transition-colors truncate">{reminder.title}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-[10px] text-white/40 font-mono">{reminder.date}</span>
                        {subject && <span className="text-[10px] font-medium" style={{ color: dotColor }}>{subject.name}</span>}
                      </div>
                    </div>
                    <button onClick={() => toggleReminder(reminder.id)} className="w-6 h-6 rounded-full border flex items-center justify-center transition-colors shrink-0" style={{ borderColor: reminder.done ? dotColor : "rgba(255,255,255,0.1)", color: reminder.done ? dotColor : "rgba(255,255,255,0.2)" }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    </button>
                  </div>
                );
              })}

              <button onClick={() => setModalOpen(true)} className="dashed-btn w-full mt-4 rounded-xl py-3.5 flex items-center justify-center gap-2 group cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:rotate-90 group-hover:scale-110"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                <span className="text-sm font-medium text-purple-300 group-hover:text-purple-200 transition-colors">Novo Lembrete</span>
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* Modal Novo Lembrete */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <h2 className="text-lg font-bold mb-4 text-white">Novo Lembrete</h2>
        <label className="block text-xs mb-1 text-white/50">Titulo</label>
        <input autoFocus type="text" value={reminderTitle} onChange={(e) => setReminderTitle(e.target.value)} placeholder="Ex: Entregar trabalho" className="w-full rounded-lg px-3 py-2.5 text-sm outline-none mb-3" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff" }} onKeyDown={(e) => e.key === "Enter" && handleAddReminder()} />
        <label className="block text-xs mb-1 text-white/50">Data</label>
        <input type="date" value={reminderDate} onChange={(e) => setReminderDate(e.target.value)} className="w-full rounded-lg px-3 py-2.5 text-sm outline-none mb-3" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff", colorScheme: "dark" }} />
        <label className="block text-xs mb-1 text-white/50">Materia (opcional)</label>
        <select value={reminderSubject} onChange={(e) => setReminderSubject(e.target.value)} className="w-full rounded-lg px-3 py-2.5 text-sm outline-none mb-5" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff" }}>
          <option value="">Nenhuma</option>
          {state.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <div className="flex gap-3">
          <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-lg text-sm font-semibold" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>Cancelar</button>
          <button onClick={handleAddReminder} className="flex-1 py-2.5 rounded-lg text-sm font-bold" style={{ background: "#8b5cf6", color: "#fff", opacity: reminderTitle.trim() ? 1 : 0.5 }}>Criar</button>
        </div>
      </Modal>

      <BottomNav />
    </main>
  );
}
