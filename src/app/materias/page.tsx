"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import BottomNav from "@/components/layout/BottomNav";
import PandaWithBook from "@/components/mascot/PandaWithBook";
import Modal from "@/components/ui/Modal";

const COLOR_OPTIONS = [
  { color: "#9B7BF7", label: "Roxo" },
  { color: "#F4845F", label: "Laranja" },
  { color: "#7BE0AD", label: "Verde" },
  { color: "#60A5FA", label: "Azul" },
];

const SUBJECT_COLORS: Record<string, { accent: string; transparent: string; semi: string; stroke: string }> = {
  "#9B7BF7": { accent: "#8b5cf6", transparent: "rgba(139, 92, 246, 0.15)", semi: "rgba(139, 92, 246, 0.4)", stroke: "#c4b5fd" },
  "#F4845F": { accent: "#f43f5e", transparent: "rgba(244, 63, 94, 0.15)", semi: "rgba(244, 63, 94, 0.4)", stroke: "#fda4af" },
  "#7BE0AD": { accent: "#10b981", transparent: "rgba(16, 185, 129, 0.15)", semi: "rgba(16, 185, 129, 0.4)", stroke: "#6ee7b7" },
  "#60A5FA": { accent: "#3b82f6", transparent: "rgba(59, 130, 246, 0.15)", semi: "rgba(59, 130, 246, 0.4)", stroke: "#93c5fd" },
};

function getColors(color: string) {
  return SUBJECT_COLORS[color] || { accent: color, transparent: `${color}26`, semi: `${color}66`, stroke: color };
}

export default function MateriasPage() {
  const router = useRouter();
  const { state, addSubject } = useStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0].color);
  const [search, setSearch] = useState("");

  function handleCreate() {
    if (!name.trim()) return;
    addSubject({ name: name.trim(), color: selectedColor, icon: "book" });
    setName("");
    setSelectedColor(COLOR_OPTIONS[0].color);
    setModalOpen(false);
  }

  return (
    <main className="w-full max-w-2xl mx-auto relative z-10 pb-36 p-6 md:p-12">
      <div className="space-y-6 pt-8">
        <div className="relative">
          <PandaWithBook />

          <section className="glass-panel rounded-2xl p-6 fade-in-up relative z-10">
            <div className="flex justify-between items-end mb-4 relative z-10">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white mb-1">Materias</h2>
                <p className="text-sm text-white/50 font-light">Suas disciplinas organizadas</p>
              </div>
            </div>

            {/* Search */}
            <div className="relative z-10 mb-4">
              <div className="flex items-center rounded-xl px-3 py-2.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                <input type="text" placeholder="Buscar materia..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 bg-transparent text-sm text-white outline-none placeholder-white/30 ml-2.5" />
              </div>
            </div>

            <div className="relative z-10 max-h-[45vh] overflow-y-auto space-y-3" >
              {state.subjects.filter((s) => s.name.toLowerCase().includes(search.toLowerCase())).map((subject) => {
                const colors = getColors(subject.color);
                const planCount = state.studyPlans.filter((p) => p.subjectId === subject.id).length;
                const noteCount = state.notes.filter((n) => n.subjectId === subject.id).length;

                return (
                  <div
                    key={subject.id}
                    className="subject-card group"
                    style={{ "--card-accent": colors.accent, "--card-accent-transparent": colors.transparent, "--card-accent-semi": colors.semi } as React.CSSProperties}
                    onClick={() => router.push(`/materias/${subject.id}`)}
                  >
                    <div className="accent-strip" style={{ background: colors.accent, boxShadow: `0 0 15px ${colors.accent}` }} />
                    <div className="subject-icon-box w-10 h-10 rounded-lg flex items-center justify-center mr-4 shrink-0" style={{ background: colors.transparent, border: `1px solid ${colors.semi}`, boxShadow: `0 0 10px ${colors.transparent}` }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={colors.stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                        <path d="M8 7h6" /><path d="M8 11h8" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-white/90 truncate group-hover:text-white transition-colors">{subject.name}</h4>
                      <p className="text-[11px] text-white/40 mt-0.5">{planCount} cronograma{planCount !== 1 ? "s" : ""} &bull; {noteCount} nota{noteCount !== 1 ? "s" : ""}</p>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="subject-chevron text-white/30 ml-2"><polyline points="9 18 15 12 9 6" /></svg>
                  </div>
                );
              })}
            </div>

            <button onClick={() => setModalOpen(true)} className="dashed-btn w-full mt-5 rounded-xl py-4 flex items-center justify-center gap-2 group cursor-pointer relative z-10">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:rotate-90 group-hover:scale-110">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span className="text-sm font-medium text-purple-300 group-hover:text-purple-200 transition-colors">Nova Materia</span>
            </button>
          </section>
        </div>
      </div>

      {/* Modal Nova Materia */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <h2 className="text-lg font-bold mb-4 text-white">Nova Materia</h2>
        <label className="block text-xs mb-1 text-white/50">Nome</label>
        <input
          autoFocus
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Psicologia Social"
          className="w-full rounded-lg px-3 py-2.5 text-sm outline-none mb-4"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff" }}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        />
        <label className="block text-xs mb-2 text-white/50">Cor</label>
        <div className="flex gap-3 mb-5">
          {COLOR_OPTIONS.map((c) => (
            <button key={c.color} onClick={() => setSelectedColor(c.color)} className="w-8 h-8 rounded-full transition-transform" style={{ background: c.color, border: selectedColor === c.color ? "2px solid #fff" : "2px solid transparent", transform: selectedColor === c.color ? "scale(1.15)" : "scale(1)" }} />
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-lg text-sm font-semibold" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>Cancelar</button>
          <button onClick={handleCreate} className="flex-1 py-2.5 rounded-lg text-sm font-bold" style={{ background: "#8b5cf6", color: "#fff", opacity: name.trim() ? 1 : 0.5 }}>Criar</button>
        </div>
      </Modal>

      <BottomNav />
    </main>
  );
}
