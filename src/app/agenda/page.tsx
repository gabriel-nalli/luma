"use client";

import { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import { useNotificationSettings } from "@/hooks/useNotificationSettings";
import BottomNav from "@/components/layout/BottomNav";
import PandaAgenda from "@/components/mascot/PandaAgenda";
import Modal from "@/components/ui/Modal";

const WEEKDAYS_PT = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
function fmtDay(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  const wd = WEEKDAYS_PT[new Date(y, m - 1, d).getDay()];
  return `${wd} ${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}`;
}

const ALERT_KINDS = [
  { key: "3d", label: "3 dias antes", hint: "Faltam 3 dias..." },
  { key: "1d", label: "Vespera", hint: "E amanha!" },
  { key: "morning", label: "No dia, cedo", hint: "Bom dia, Emily!" },
  { key: "before", label: "Pouco antes", hint: "Em 30 min" },
] as const;
type AlertKey = typeof ALERT_KINDS[number]["key"];

const inputStyle = { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff", colorScheme: "dark" } as React.CSSProperties;

function Toggle({ on, onChange, color = "#8b5cf6" }: { on: boolean; onChange: (v: boolean) => void; color?: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} className="relative w-10 h-6 rounded-full transition-colors shrink-0" style={{ background: on ? color : "rgba(255,255,255,0.12)", boxShadow: on ? `0 0 12px ${color}66` : "none" }}>
      <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform" style={{ left: 2, transform: on ? "translateX(16px)" : "translateX(0)" }} />
    </button>
  );
}

const SUBJECT_COLORS: Record<string, string> = {
  "#9B7BF7": "#a78bfa",
  "#F4845F": "#fb7185",
  "#7BE0AD": "#34d399",
  "#60A5FA": "#60a5fa",
};

const DAYS_HEADER = ["D", "S", "T", "Q", "Q", "S", "S"];

type AgendaFilter = "todos" | "hoje" | "semana";

export default function AgendaPage() {
  const { state, toggleReminder, addReminder, deleteReminder } = useStore();
  const { settings, update: updateSettings, saving: savingSettings } = useNotificationSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);
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
  const [reminderTime, setReminderTime] = useState("");
  const [alerts, setAlerts] = useState<Record<AlertKey, boolean>>({ "3d": true, "1d": true, morning: true, before: true });

  function openModal(date = "") {
    setReminderDate(date);
    setReminderTitle("");
    setReminderSubject("");
    setReminderTime("");
    setAlerts({ "3d": settings.enabled3d, "1d": settings.enabled1d, morning: settings.enabledMorning, before: settings.enabledBefore });
    setModalOpen(true);
  }

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
    const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    addReminder({
      title: reminderTitle.trim(),
      date: reminderDate || localToday,
      time: reminderTime || null,
      subjectId: reminderSubject || undefined,
      done: false,
      notify3d: alerts["3d"], notify1d: alerts["1d"], notifyMorning: alerts.morning, notifyBefore: alerts.before,
    });
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

                    function handleDayClick() { openModal(dateStr); }

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
                        <span className="text-[10px] text-white/40 font-mono">{fmtDay(reminder.date)}{reminder.time ? ` · ${reminder.time}` : ""}</span>
                        {subject && <span className="text-[10px] font-medium" style={{ color: dotColor }}>{subject.name}</span>}
                        {(reminder.notify3d || reminder.notify1d || reminder.notifyMorning || reminder.notifyBefore) && !reminder.done && (
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
                        )}
                      </div>
                    </div>
                    <button onClick={() => deleteReminder(reminder.id)} aria-label="Apagar lembrete" className="subject-delete p-1.5 rounded-lg shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
                    </button>
                    <button onClick={() => toggleReminder(reminder.id)} className="w-6 h-6 rounded-full border flex items-center justify-center transition-colors shrink-0" style={{ borderColor: reminder.done ? dotColor : "rgba(255,255,255,0.1)", color: reminder.done ? dotColor : "rgba(255,255,255,0.2)" }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    </button>
                  </div>
                );
              })}

              <button onClick={() => openModal("")} className="dashed-btn w-full mt-4 rounded-xl py-3.5 flex items-center justify-center gap-2 group cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:rotate-90 group-hover:scale-110"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                <span className="text-sm font-medium text-purple-300 group-hover:text-purple-200 transition-colors">Novo Lembrete</span>
              </button>

              {/* Configuracoes dos avisos */}
              <div className="glass-panel rounded-[14px] mt-6 overflow-hidden">
                <button onClick={() => setSettingsOpen((v) => !v)} className="w-full flex items-center gap-3 p-4 text-left">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.35)" }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c4b5fd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold text-white/90">Avisos da agenda</p>
                    <p className="text-[11px] text-white/40">{[settings.enabled3d && "3 dias", settings.enabled1d && "vespera", settings.enabledMorning && "no dia", settings.enabledBefore && `${settings.minutesBefore} min antes`].filter(Boolean).join(" · ") || "Todos desligados"}{savingSettings ? " · salvando..." : ""}</p>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/30 transition-transform" style={{ transform: settingsOpen ? "rotate(180deg)" : "none" }}><polyline points="6 9 12 15 18 9" /></svg>
                </button>
                {settingsOpen && (
                  <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-4">
                    <div className="flex items-center justify-between gap-3">
                      <div><p className="text-xs text-white/80">3 dias antes</p><p className="text-[10px] text-white/35">"Faltam 3 dias: ..."</p></div>
                      <div className="flex items-center gap-2">
                        <input type="time" value={settings.time3d} onChange={(e) => updateSettings({ time3d: e.target.value })} className="rounded-lg px-2 py-1.5 text-xs outline-none w-24" style={inputStyle} />
                        <Toggle on={settings.enabled3d} onChange={(v) => updateSettings({ enabled3d: v })} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div><p className="text-xs text-white/80">Vespera</p><p className="text-[10px] text-white/35">"E amanha! ..."</p></div>
                      <div className="flex items-center gap-2">
                        <input type="time" value={settings.time1d} onChange={(e) => updateSettings({ time1d: e.target.value })} className="rounded-lg px-2 py-1.5 text-xs outline-none w-24" style={inputStyle} />
                        <Toggle on={settings.enabled1d} onChange={(v) => updateSettings({ enabled1d: v })} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div><p className="text-xs text-white/80">No dia, cedo</p><p className="text-[10px] text-white/35">"Bom dia, Emily! Hoje tem ..."</p></div>
                      <div className="flex items-center gap-2">
                        <input type="time" value={settings.timeMorning} onChange={(e) => updateSettings({ timeMorning: e.target.value })} className="rounded-lg px-2 py-1.5 text-xs outline-none w-24" style={inputStyle} />
                        <Toggle on={settings.enabledMorning} onChange={(v) => updateSettings({ enabledMorning: v })} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div><p className="text-xs text-white/80">Pouco antes</p><p className="text-[10px] text-white/35">minutos antes do horario</p></div>
                      <div className="flex items-center gap-2">
                        <input type="number" min={5} max={240} step={5} value={settings.minutesBefore} onChange={(e) => updateSettings({ minutesBefore: Math.max(5, Number(e.target.value) || 30) })} className="rounded-lg px-2 py-1.5 text-xs outline-none w-24" style={inputStyle} />
                        <Toggle on={settings.enabledBefore} onChange={(v) => updateSettings({ enabledBefore: v })} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/5">
                      <div><p className="text-xs text-white/80">Horario padrao</p><p className="text-[10px] text-white/35">usado quando o lembrete nao tem hora (sua aula)</p></div>
                      <input type="time" value={settings.defaultEventTime} onChange={(e) => updateSettings({ defaultEventTime: e.target.value })} className="rounded-lg px-2 py-1.5 text-xs outline-none w-24" style={inputStyle} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Modal Novo Lembrete */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <h2 className="text-lg font-bold mb-4 text-white">Novo Lembrete</h2>
        <label className="block text-xs mb-1 text-white/50">Titulo</label>
        <input autoFocus type="text" value={reminderTitle} onChange={(e) => setReminderTitle(e.target.value)} placeholder="Ex: Entregar trabalho" className="w-full rounded-lg px-3 py-2.5 text-sm outline-none mb-3" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff" }} onKeyDown={(e) => e.key === "Enter" && handleAddReminder()} />
        <div className="grid grid-cols-[1fr_auto] gap-3 mb-3">
          <div>
            <label className="block text-xs mb-1 text-white/50">Data</label>
            <input type="date" value={reminderDate} onChange={(e) => setReminderDate(e.target.value)} className="w-full rounded-lg px-3 py-2.5 text-sm outline-none" style={inputStyle} />
          </div>
          <div>
            <label className="block text-xs mb-1 text-white/50">Horario</label>
            <input type="time" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)} className="w-28 rounded-lg px-3 py-2.5 text-sm outline-none" style={inputStyle} />
          </div>
        </div>
        {!reminderTime && <p className="text-[10px] text-white/35 -mt-2 mb-3">Sem horario, o aviso "pouco antes" usa {settings.defaultEventTime || "19:15"} (horario padrao da sua aula).</p>}
        <label className="block text-xs mb-1 text-white/50">Materia (opcional)</label>
        <select value={reminderSubject} onChange={(e) => setReminderSubject(e.target.value)} className="w-full rounded-lg px-3 py-2.5 text-sm outline-none mb-5" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff" }}>
          <option value="">Nenhuma</option>
          {state.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <label className="block text-xs mb-2 text-white/50">Me avisar</label>
        <div className="grid grid-cols-2 gap-2 mb-5">
          {ALERT_KINDS.map((k) => {
            const on = alerts[k.key];
            return (
              <button key={k.key} type="button" onClick={() => setAlerts((a) => ({ ...a, [k.key]: !a[k.key] }))} className="flex items-center gap-2 rounded-lg px-3 py-2 text-left transition-all" style={{ background: on ? "rgba(139,92,246,0.25)" : "rgba(255,255,255,0.04)", border: on ? "1px solid #a78bfa" : "1px solid rgba(255,255,255,0.08)" }}>
                <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0" style={{ background: on ? "#a78bfa" : "transparent", border: on ? "none" : "1px solid rgba(255,255,255,0.25)" }}>
                  {on && <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                </span>
                <span>
                  <span className="block text-xs font-semibold" style={{ color: on ? "#fff" : "rgba(255,255,255,0.6)" }}>{k.label}</span>
                  <span className="block text-[10px] text-white/35">{k.key === "before" ? `${settings.minutesBefore} min antes` : k.hint}</span>
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex gap-3">
          <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-lg text-sm font-semibold" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>Cancelar</button>
          <button onClick={handleAddReminder} className="flex-1 py-2.5 rounded-lg text-sm font-bold" style={{ background: "#8b5cf6", color: "#fff", opacity: reminderTitle.trim() ? 1 : 0.5 }}>Criar</button>
        </div>
      </Modal>

      <BottomNav />
    </main>
  );
}
