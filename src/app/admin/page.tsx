"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthProvider";
import { supabase } from "@/lib/supabase";
import BottomNav from "@/components/layout/BottomNav";

const SUPABASE_URL = "https://vnrfzgbqiagxidcaeanr.supabase.co";

const QUICK_MESSAGES = [
  { type: "boa_aula", label: "Boa aula", icon: "📚" },
  { type: "revisao", label: "Revisao", icon: "🔍" },
  { type: "sequencia", label: "Sequencia", icon: "🔥" },
  { type: "cronograma", label: "Cronograma", icon: "📝" },
];

interface Device { device_id: string; email: string | null; label: string | null; last_seen_at: string | null; registered_at: string; host: string }
interface PushLog { id: string; sent_at: string; source: string; title: string; body: string | null; total: number; sent: number; results: { device_id: string; host: string; ok: boolean; status: number | null; error?: string }[] }

const fmtDateTime = (iso: string) => new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
const SOURCE_LABEL: Record<string, string> = { custom: "Personalizado", test: "Teste (home)", "cron:revisao": "Cron · Revisao", "cron:boa_aula": "Cron · Boa aula", "cron:sequencia": "Cron · Sequencia", "cron:cronograma": "Cron · Cronograma", "agenda:3d": "Agenda · 3 dias", "agenda:1d": "Agenda · Vespera", "agenda:morning": "Agenda · Bom dia", "agenda:before": "Agenda · Pouco antes" };

export default function AdminPage() {
  const { isAdmin, user, signOut } = useAuth();
  const [customTitle, setCustomTitle] = useState("");
  const [customBody, setCustomBody] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [logs, setLogs] = useState<PushLog[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const loadData = useCallback(async () => {
    const [subsRes, devRes, logRes] = await Promise.all([
      supabase.from("push_subscriptions").select("user_id, endpoint, created_at").eq("app", "luma"),
      supabase.from("luma_devices").select("device_id, email, label, last_seen_at"),
      supabase.from("luma_push_log").select("*").order("sent_at", { ascending: false }).limit(20),
    ]);
    const devMap = new Map((devRes.data || []).map((d: any) => [d.device_id, d]));
    setDevices((subsRes.data || []).map((s: any) => {
      const d = devMap.get(s.user_id);
      return { device_id: s.user_id, email: d?.email ?? null, label: d?.label ?? null, last_seen_at: d?.last_seen_at ?? null, registered_at: s.created_at, host: String(s.endpoint).match(/^https?:\/\/[^/]+/)?.[0]?.replace("https://", "") || "?" };
    }));
    setLogs((logRes.data || []) as PushLog[]);
    setLoadingData(false);
  }, []);

  useEffect(() => { if (isAdmin) loadData(); }, [isAdmin, loadData]);

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

  function describeResult(data: any) {
    if (data?.error) return { ok: false, text: `Erro: ${data.error}` };
    const total = data?.total ?? 0;
    if (total === 0) return { ok: false, text: "Nenhum aparelho registrado — ninguem recebeu." };
    const parts = (data?.results || []).map((r: any) => {
      const d = devices.find((x) => x.device_id === r.device_id);
      const who = d?.email || d?.label || r.host;
      return `${r.ok ? "✓" : "✗"} ${who}${r.ok ? "" : ` (${r.status ?? r.error ?? "falhou"})`}`;
    });
    return { ok: data.sent > 0, text: `Enviado pra ${data.sent}/${total}: ${parts.join(" · ")}` };
  }

  async function send(body: Record<string, unknown>) {
    setSending(true);
    setResult(null);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/luma-notifications`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      setResult(describeResult(data));
    } catch (e) {
      setResult({ ok: false, text: `Erro ao enviar: ${(e as Error)?.message || e}` });
    }
    setSending(false);
    loadData();
  }

  const panel = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" };
  const input = { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff" };

  return (
    <main className="w-full max-w-2xl mx-auto relative z-10 pb-36 p-6 md:p-12">
      <div className="space-y-5 pt-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Admin</h2>
            <p className="text-xs text-white/40">{user?.email}</p>
          </div>
          <button onClick={signOut} className="text-xs text-[#fb7185] px-3 py-1.5 rounded-lg" style={{ background: "rgba(251,113,133,0.1)", border: "1px solid rgba(251,113,133,0.2)" }}>Sair</button>
        </div>

        {/* Aparelhos */}
        <section className="glass-panel rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-semibold tracking-widest text-white/50 uppercase">Aparelhos recebendo push</h3>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: devices.length ? "rgba(52,211,153,0.15)" : "rgba(244,63,94,0.15)", color: devices.length ? "#6ee7b7" : "#fda4af" }}>{devices.length}</span>
          </div>
          {loadingData ? <p className="text-xs text-white/30">Carregando...</p> : devices.length === 0 ? (
            <p className="text-xs text-white/40">Nenhum aparelho registrado. Abra o Luma no celular e toque em "Permitir notificacoes".</p>
          ) : (
            <div className="space-y-2">
              {devices.map((d) => (
                <div key={d.device_id} className="rounded-xl p-3 flex items-center gap-3" style={panel}>
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: "#34d399", boxShadow: "0 0 8px #34d399" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/90 truncate">{d.email || "sem login identificado"}</p>
                    <p className="text-[11px] text-white/40 truncate">{d.label || d.host}{d.last_seen_at ? ` · visto ${fmtDateTime(d.last_seen_at)}` : ` · registrado ${fmtDateTime(d.registered_at)}`}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Quick push */}
        <section className="glass-panel rounded-2xl p-5">
          <h3 className="text-[10px] font-semibold tracking-widest text-white/50 uppercase mb-4">Push Rapido</h3>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_MESSAGES.map((m) => (
              <button key={m.type} onClick={() => send({ type: m.type })} disabled={sending} className="p-3 rounded-xl text-left transition-colors hover:bg-white/5" style={panel}>
                <span className="text-lg">{m.icon}</span>
                <p className="text-xs font-medium text-white/70 mt-1">{m.label}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Custom push */}
        <section className="glass-panel rounded-2xl p-5">
          <h3 className="text-[10px] font-semibold tracking-widest text-white/50 uppercase mb-4">Push Personalizado</h3>
          <input type="text" value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} placeholder="Titulo da notificacao" className="w-full rounded-lg px-3 py-2.5 text-sm outline-none mb-3" style={input} />
          <textarea value={customBody} onChange={(e) => setCustomBody(e.target.value)} placeholder="Mensagem..." rows={3} className="w-full rounded-lg px-3 py-2.5 text-sm outline-none mb-3 resize-none" style={input} />
          <button
            onClick={async () => { const t = customTitle.trim(), b = customBody.trim(); if (!t || !b) return; await send({ title: t, body: b, url: "/", source: "custom" }); setCustomTitle(""); setCustomBody(""); }}
            disabled={sending || !customTitle.trim() || !customBody.trim()}
            className="w-full py-3 rounded-xl text-sm font-bold"
            style={{ background: "#8b5cf6", color: "#fff", opacity: sending || !customTitle.trim() || !customBody.trim() ? 0.4 : 1 }}
          >
            {sending ? "Enviando..." : "Enviar Push"}
          </button>
        </section>

        {result && (
          <div className="text-center text-xs py-2 px-3 rounded-xl" style={{ color: result.ok ? "#6ee7b7" : "#fda4af", background: result.ok ? "rgba(52,211,153,0.08)" : "rgba(244,63,94,0.08)" }}>{result.text}</div>
        )}

        {/* Historico */}
        <section className="glass-panel rounded-2xl p-5">
          <h3 className="text-[10px] font-semibold tracking-widest text-white/50 uppercase mb-4">Ultimos envios</h3>
          {logs.length === 0 ? <p className="text-xs text-white/40">Nenhum envio registrado ainda.</p> : (
            <div className="space-y-2">
              {logs.map((l) => {
                const allOk = l.total > 0 && l.sent === l.total;
                const color = l.total === 0 ? "#fbbf24" : allOk ? "#6ee7b7" : l.sent > 0 ? "#fbbf24" : "#fda4af";
                return (
                  <div key={l.id} className="rounded-xl p-3" style={panel}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm text-white/90 truncate">{l.title}</p>
                      <span className="text-[11px] font-bold shrink-0" style={{ color }}>{l.sent}/{l.total}</span>
                    </div>
                    <p className="text-[11px] text-white/40 mt-0.5">{fmtDateTime(l.sent_at)} · {SOURCE_LABEL[l.source] || l.source}</p>
                    {l.results?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {l.results.map((r, i) => {
                          const d = devices.find((x) => x.device_id === r.device_id);
                          const who = d?.email?.split("@")[0] || d?.label || r.host;
                          return (
                            <span key={i} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: r.ok ? "rgba(52,211,153,0.12)" : "rgba(244,63,94,0.12)", color: r.ok ? "#6ee7b7" : "#fda4af" }} title={r.error || ""}>
                              {r.ok ? "✓" : "✗"} {who}{!r.ok && r.status ? ` ${r.status}` : ""}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <BottomNav />
    </main>
  );
}
