"use client";

import { useEffect, useState } from "react";
import { usePushNotifications } from "@/hooks/usePushNotifications";

const DISMISS_KEY = "luma_push_dismissed";

function BellIcon({ color = "#a78bfa" }: { color?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

export default function PushNotificationsCard() {
  const { status, loading, errorMsg, requestPermission, refresh, sendTest } = usePushNotifications();
  const [dismissed, setDismissed] = useState(true);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    // So o convite inicial e dispensavel; problemas reais sempre aparecem
    const wasDismissed = !!localStorage.getItem(DISMISS_KEY);
    const timer = setTimeout(() => setDismissed(wasDismissed), 3000);
    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    setDismissed(true);
    localStorage.setItem(DISMISS_KEY, "1");
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    const r = await sendTest();
    setTestResult(r);
    setTesting(false);
  }

  if (status === "loading" || status === "unsupported") return null;

  // ── Ativo: linha discreta com botao de teste ──────────────────────────────
  if (status === "active") {
    return (
      <div className="flex items-center gap-2 px-1 fade-in-up delay-1">
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#34d399", boxShadow: "0 0 8px #34d399" }} />
        <span className="text-[11px] text-white/40">Notificacoes ativas</span>
        <span className="text-white/15 text-[11px]">&bull;</span>
        <button onClick={handleTest} disabled={testing} className="text-[11px] font-semibold text-purple-300 hover:text-purple-200 transition-colors disabled:opacity-50">
          {testing ? "Enviando..." : "Enviar teste"}
        </button>
        {testResult && (
          <span className="text-[11px]" style={{ color: testResult.ok ? "#6ee7b7" : "#fda4af" }}>
            {testResult.ok ? "✓ " : "✗ "}{testResult.message}
          </span>
        )}
      </div>
    );
  }

  // Convites (default / iOS / bloqueado) podem ser dispensados; falhas nao
  const dismissable = status === "default" || status === "ios-install" || status === "denied";
  if (dismissable && dismissed) return null;

  let title = "";
  let subtitle: React.ReactNode = "";
  let action: React.ReactNode = null;
  let accent = "#a78bfa";

  if (status === "default") {
    title = "Ative as notificacoes";
    subtitle = "Lembretes de estudo e avisos de aula";
    action = (
      <button onClick={requestPermission} disabled={loading} className="px-3 py-1.5 rounded-lg text-[11px] font-bold shrink-0" style={{ background: "#8b5cf6", color: "#fff" }}>
        {loading ? "..." : "Ativar"}
      </button>
    );
  } else if (status === "ios-install") {
    title = "Instale o Luma pra receber notificacoes";
    subtitle = <>No iPhone: toque em <span className="text-white/70">Compartilhar</span> &rarr; <span className="text-white/70">Adicionar a Tela de Inicio</span> e abra por la.</>;
  } else if (status === "denied") {
    accent = "#fda4af";
    title = "Notificacoes bloqueadas no navegador";
    subtitle = "Libere nas configuracoes do site (cadeado na barra de endereco) e recarregue.";
    action = (
      <button onClick={refresh} className="px-3 py-1.5 rounded-lg text-[11px] font-bold shrink-0" style={{ background: "rgba(255,255,255,0.08)", color: "#fff" }}>
        Verificar
      </button>
    );
  } else {
    // inactive / error: permissao ok mas inscricao falhou
    accent = "#fbbf24";
    title = "Notificacoes nao estao ativas";
    subtitle = errorMsg ? <span className="break-words">Erro: {errorMsg}</span> : "Nao foi possivel registrar este dispositivo.";
    action = (
      <button onClick={requestPermission} disabled={loading} className="px-3 py-1.5 rounded-lg text-[11px] font-bold shrink-0" style={{ background: "#8b5cf6", color: "#fff" }}>
        {loading ? "..." : "Tentar de novo"}
      </button>
    );
  }

  return (
    <section className="rounded-2xl p-4 fade-in-up delay-1 flex items-center gap-3" style={{ background: `${accent}1a`, border: `1px solid ${accent}40` }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${accent}33` }}>
        <BellIcon color={accent} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-white/80">{title}</p>
        <p className="text-[10px] text-white/40 leading-snug">{subtitle}</p>
      </div>
      {action}
      {dismissable && (
        <button onClick={dismiss} aria-label="Fechar" className="text-white/20 hover:text-white/50 shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>
      )}
    </section>
  );
}
