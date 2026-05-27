"use client";

import { useState } from "react";
import { useAuth } from "@/lib/AuthProvider";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/layout/BottomNav";

const SUPABASE_URL = "https://vnrfzgbqiagxidcaeanr.supabase.co";

const QUICK_MESSAGES = [
  { type: "boa_aula", label: "Boa aula", icon: "📚" },
  { type: "revisao", label: "Revisao", icon: "🔍" },
  { type: "sequencia", label: "Sequencia", icon: "🔥" },
  { type: "cronograma", label: "Cronograma", icon: "📝" },
];

export default function AdminPage() {
  const { isAdmin, user, signOut } = useAuth();
  const router = useRouter();
  const [customTitle, setCustomTitle] = useState("");
  const [customBody, setCustomBody] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState("");

  if (!isAdmin) {
    return (
      <main className="w-full max-w-2xl mx-auto relative z-10 pb-36 p-6 md:p-12">
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-white/40 text-sm">Acesso restrito a administradores</p>
        </div>
        <BottomNav />
      </main>
    );
  }

  async function sendQuick(type: string) {
    setSending(true);
    setResult("");
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/luma-notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      setResult(`Enviado pra ${data.sent || 0} dispositivo(s)`);
    } catch {
      setResult("Erro ao enviar");
    }
    setSending(false);
  }

  async function sendCustom() {
    if (!customTitle.trim() || !customBody.trim()) return;
    setSending(true);
    setResult("");
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/luma-notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: customTitle.trim(), body: customBody.trim(), url: "/" }),
      });
      const data = await res.json();
      setResult(`Enviado pra ${data.sent || 0} dispositivo(s)`);
      setCustomTitle("");
      setCustomBody("");
    } catch {
      setResult("Erro ao enviar");
    }
    setSending(false);
  }

  return (
    <main className="w-full max-w-2xl mx-auto relative z-10 pb-36 p-6 md:p-12">
      <div className="space-y-5 pt-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Admin</h2>
            <p className="text-xs text-white/40">{user?.email}</p>
          </div>
          <button onClick={signOut} className="text-xs text-[#fb7185] px-3 py-1.5 rounded-lg" style={{ background: "rgba(251,113,133,0.1)", border: "1px solid rgba(251,113,133,0.2)" }}>
            Sair
          </button>
        </div>

        {/* Quick push */}
        <section className="glass-panel rounded-2xl p-5">
          <h3 className="text-[10px] font-semibold tracking-widest text-white/50 uppercase mb-4">Push Rapido</h3>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_MESSAGES.map((m) => (
              <button
                key={m.type}
                onClick={() => sendQuick(m.type)}
                disabled={sending}
                className="p-3 rounded-xl text-left transition-colors hover:bg-white/5"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <span className="text-lg">{m.icon}</span>
                <p className="text-xs font-medium text-white/70 mt-1">{m.label}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Custom push */}
        <section className="glass-panel rounded-2xl p-5">
          <h3 className="text-[10px] font-semibold tracking-widest text-white/50 uppercase mb-4">Push Personalizado</h3>
          <input
            type="text"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder="Titulo da notificacao"
            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none mb-3"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff" }}
          />
          <textarea
            value={customBody}
            onChange={(e) => setCustomBody(e.target.value)}
            placeholder="Mensagem..."
            rows={3}
            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none mb-3 resize-none"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff" }}
          />
          <button
            onClick={sendCustom}
            disabled={sending || !customTitle.trim() || !customBody.trim()}
            className="w-full py-3 rounded-xl text-sm font-bold"
            style={{ background: "#8b5cf6", color: "#fff", opacity: sending || !customTitle.trim() || !customBody.trim() ? 0.4 : 1 }}
          >
            {sending ? "Enviando..." : "Enviar Push"}
          </button>
        </section>

        {/* Result */}
        {result && (
          <div className="text-center text-xs text-white/50 py-2">{result}</div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
