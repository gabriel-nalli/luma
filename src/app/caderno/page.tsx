"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import type { Note } from "@/lib/store";
import BottomNav from "@/components/layout/BottomNav";
import PandaCaderno from "@/components/mascot/PandaCaderno";
import Modal from "@/components/ui/Modal";
import DrawingCanvas from "@/components/ui/DrawingCanvas";
import DrawingPreview from "@/components/ui/DrawingPreview";

type NoteMode = "text" | "draw";

const SUBJECT_COLORS: Record<string, string> = {
  "#9B7BF7": "#a78bfa",
  "#F4845F": "#fb7185",
  "#7BE0AD": "#34d399",
  "#60A5FA": "#60a5fa",
};

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export default function CadernoPage() {
  const { state, addNote, updateNote, deleteNote } = useStore();
  const [filter, setFilter] = useState<string | null>(null);

  // Modal state - used for both create and edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteSubject, setNoteSubject] = useState("");
  const [noteMode, setNoteMode] = useState<NoteMode>("text");
  const [drawingStrokes, setDrawingStrokes] = useState<any[]>([]);
  const [viewingNote, setViewingNote] = useState<Note | null>(null);

  const filteredNotes = filter
    ? state.notes.filter((n) => n.subjectId === filter)
    : state.notes;

  function openCreateModal() {
    setEditingNote(null);
    setNoteTitle("");
    setNoteContent("");
    setNoteSubject("");
    setNoteMode("text");
    setDrawingStrokes([]);
    setModalOpen(true);
  }

  function openEditModal(note: Note) {
    setEditingNote(note);
    setNoteTitle(note.title);
    setNoteSubject(note.subjectId);
    // Check if content has drawing data
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
    setModalOpen(true);
  }

  function handleSave() {
    if (!noteTitle.trim() || !noteSubject) return;

    const contentToSave = noteMode === "draw"
      ? JSON.stringify({ _type: "drawing", strokes: drawingStrokes })
      : noteContent;

    if (editingNote) {
      updateNote(editingNote.id, {
        title: noteTitle.trim(),
        content: contentToSave,
        subjectId: noteSubject,
      });
    } else {
      addNote({ subjectId: noteSubject, title: noteTitle.trim(), content: contentToSave });
    }

    setNoteTitle("");
    setNoteContent("");
    setNoteSubject("");
    setEditingNote(null);
    setModalOpen(false);
  }

  function handleDelete() {
    if (!editingNote) return;
    deleteNote(editingNote.id);
    setEditingNote(null);
    setModalOpen(false);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingNote(null);
  }

  return (
    <main className="w-full max-w-2xl mx-auto relative z-10 pb-36 p-6 md:p-12">
      <div className="space-y-6 pt-8">
        <div className="relative">
          <PandaCaderno />

          <section className="relative z-10 fade-in-up">
            <div className="mb-5 relative z-10">
              <h2 className="text-3xl font-bold tracking-tight text-white mb-1">Caderno</h2>
              <p className="text-sm text-white/50 font-light">{state.notes.length} nota{state.notes.length !== 1 ? "s" : ""} salva{state.notes.length !== 1 ? "s" : ""}</p>
            </div>

            <div className="flex items-center space-x-3 mb-6 overflow-x-auto pb-2 relative z-10" style={{ scrollbarWidth: "none" } as React.CSSProperties}>
              <button onClick={() => setFilter(null)} className={`px-5 py-1.5 rounded-full text-xs whitespace-nowrap transition-all ${filter === null ? "font-semibold bg-gradient-to-r from-[#9333ea] to-[#a855f7] text-white shadow-[0_0_15px_rgba(168,85,247,0.4)] border border-[#c084fc]/30" : "font-medium bg-white/[0.03] border border-white/10 text-white/40 hover:bg-white/10 hover:text-white/80"}`}>Todas</button>
              {state.subjects.map((s) => (
                <button key={s.id} onClick={() => setFilter(s.id)} className={`px-5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${filter === s.id ? "bg-gradient-to-r from-[#9333ea] to-[#a855f7] text-white shadow-[0_0_15px_rgba(168,85,247,0.4)] border border-[#c084fc]/30" : "bg-white/[0.03] border border-white/10 text-white/40 hover:bg-white/10 hover:text-white/80"}`}>{s.name}</button>
              ))}
            </div>

            <div className="space-y-3 max-h-[55vh] overflow-y-auto" >
              {filteredNotes.length === 0 && <p className="text-center py-10 text-white/40 text-sm">Nenhuma nota encontrada.</p>}
              {filteredNotes.map((note) => {
                const subject = state.subjects.find((s) => s.id === note.subjectId);
                const accentColor = subject ? (SUBJECT_COLORS[subject.color] || subject.color) : "#a78bfa";
                const dateStr = new Date(note.createdAt).toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" });
                let preview = "Sem conteudo";
                let isDrawingNote = false;
                try {
                  const parsed = JSON.parse(note.content);
                  if (parsed._type === "drawing") {
                    isDrawingNote = true;
                    preview = `Desenho com ${parsed.strokes?.length || 0} tracos`;
                  } else {
                    preview = stripHtml(note.content);
                  }
                } catch {
                  preview = stripHtml(note.content) || "Sem conteudo";
                }

                return (
                  <div key={note.id} onClick={() => isDrawingNote ? setViewingNote(note) : openEditModal(note)} className="glass-panel hoverable rounded-xl p-5 cursor-pointer group hover:bg-white/5">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-[15px] font-semibold text-white/90 transition-colors">{note.title}</h3>
                      <span className="text-[10px] text-white/40 whitespace-nowrap ml-4 mt-1">{dateStr}</span>
                    </div>
                    <div className="text-[9px] font-bold tracking-widest uppercase mb-4" style={{ color: accentColor }}>{subject?.name || "Sem materia"}</div>
                    {isDrawingNote ? (
                      <div className="mt-2 rounded-lg overflow-hidden" style={{ background: "rgba(0,0,0,0.2)" }}>
                        <DrawingPreview content={note.content} height={80} />
                      </div>
                    ) : (
                      <div className="text-[11px] text-white/40 line-clamp-2 opacity-70">{preview}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      {/* FAB */}
      <div className="fixed bottom-[105px] right-6 md:right-[calc(50%-300px)] z-50 fade-in-up">
        <button onClick={openCreateModal} className="fab-button">
          <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
        </button>
      </div>

      {/* Modal Visualizar Desenho */}
      <Modal open={!!viewingNote} onClose={() => setViewingNote(null)} fullscreen>
        {viewingNote && (
          <>
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setViewingNote(null)} className="text-white/50 hover:text-white transition-colors text-sm flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                Voltar
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { deleteNote(viewingNote.id); setViewingNote(null); }}
                  className="text-[#fb7185] text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-[#fb7185]/10 transition-colors"
                >
                  Excluir
                </button>
                <button
                  onClick={() => { openEditModal(viewingNote); setViewingNote(null); }}
                  className="text-sm font-bold px-5 py-1.5 rounded-lg transition-colors"
                  style={{ background: "#8b5cf6", color: "#fff" }}
                >
                  Editar
                </button>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white mb-1">{viewingNote.title}</h2>
            <p className="text-xs text-white/30 mb-4">
              {(() => { const s = state.subjects.find((s) => s.id === viewingNote.subjectId); return s?.name || ""; })()}
            </p>

            <div className="flex-1 rounded-xl overflow-y-auto" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <DrawingPreview content={viewingNote.content} height={600} />
            </div>
          </>
        )}
      </Modal>

      {/* Modal Criar / Editar Nota */}
      <Modal open={modalOpen} onClose={closeModal} fullscreen>
        {/* Top bar */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={closeModal} className="text-white/50 hover:text-white transition-colors text-sm flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            Voltar
          </button>
          <div className="flex items-center gap-2">
            {editingNote && (
              <button onClick={handleDelete} className="text-[#fb7185] text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-[#fb7185]/10 transition-colors">
                Excluir
              </button>
            )}
            <button onClick={handleSave} className="text-sm font-bold px-5 py-1.5 rounded-lg transition-colors" style={{ background: "#8b5cf6", color: "#fff", opacity: noteTitle.trim() && noteSubject ? 1 : 0.4 }}>
              Salvar
            </button>
          </div>
        </div>

        {/* Materia + Mode toggle */}
        <div className="flex items-center gap-2 mb-3">
          <select value={noteSubject} onChange={(e) => setNoteSubject(e.target.value)} className="flex-1 rounded-lg px-3 py-2 text-xs outline-none" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#a78bfa" }}>
            <option value="">Selecione a materia...</option>
            {state.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          {/* Mode toggle */}
          <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
            <button
              onClick={() => setNoteMode("text")}
              className="px-3 py-2 text-[11px] font-medium transition-colors"
              style={{ background: noteMode === "text" ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.02)", color: noteMode === "text" ? "#a78bfa" : "rgba(255,255,255,0.3)" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7V4h16v3" /><path d="M9 20h6" /><path d="M12 4v16" /></svg>
            </button>
            <button
              onClick={() => setNoteMode("draw")}
              className="px-3 py-2 text-[11px] font-medium transition-colors"
              style={{ background: noteMode === "draw" ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.02)", color: noteMode === "draw" ? "#a78bfa" : "rgba(255,255,255,0.3)" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
            </button>
          </div>
        </div>

        {/* Title */}
        <input
          autoFocus
          type="text"
          value={noteTitle}
          onChange={(e) => setNoteTitle(e.target.value)}
          placeholder="Titulo da nota"
          className="w-full text-2xl font-bold outline-none mb-3 bg-transparent text-white placeholder-white/20"
        />

        {/* Divider */}
        <div className="h-px w-full bg-white/5 mb-3" />

        {/* Text mode */}
        {noteMode === "text" && (
          <textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="Comece a escrever..."
            className="flex-1 w-full bg-transparent text-[15px] leading-relaxed outline-none resize-none text-white/80 placeholder-white/20 px-1"
          />
        )}

        {/* Draw mode */}
        {noteMode === "draw" && (
          <DrawingCanvas strokes={drawingStrokes} onChange={setDrawingStrokes} />
        )}
      </Modal>

      <BottomNav />
    </main>
  );
}
