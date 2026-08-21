"use client";

import { useEffect, useState } from "react";
import { usePushNotifications, type PushStatus } from "@/hooks/usePushNotifications";
import Modal from "@/components/ui/Modal";
import PandaChat from "@/components/mascot/PandaChat";

const DISMISS_KEY = "luma_push_dismissed";
// "Agora nao" vale so pra esta visita: na proxima vez que ela entrar, pergunta de novo
const MODAL_SESSION_KEY = "luma_push_modal_seen";
const MODAL_STATES: PushStatus[] = ["default", "ios-install", "inactive", "error"];

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
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDone, setModalDone] = useState(false);

  // Pop-up de boas-vindas: abre assim que sabemos que falta permissao/inscricao
  useEffect(() => {
    if (!MODAL_STATES.includes(status)) return;
    let seen = false;
    try { seen = !!sessionStorage.getItem(MODAL_SESSION_KEY); } catch {}
    if (seen) return;
    const timer = setTimeout(() => setModalOpen(true), 900);
    return () => clearTimeout(timer);
  }, [status]);

  function closeModal() {
    setModalOpen(false);
    try { sessionStorage.setItem(MODAL_SESSION_KEY, "1"); } catch {}
  }

  async function handleAllow() {
    const ok = await requestPermission();
    if (ok) {
      setModalDone(true);
      setTimeout(() => { setModalDone(false); closeModal(); }, 1600);
    }
  }

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

  const modal = (
    <Modal open={modalOpen} onClose={closeModal}>
      <div className="relative">
        <PandaChat />
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: "rgba(139,92,246,0.2)", border: "1px solid rgba(139,92,246,0.45)", boxShadow: "0 0 24px rgba(139,92,246,0.35)" }}>
          <BellIcon color={modalDone ? "#6ee7b7" : "#c4b5fd"} />
        </div>

        {modalDone ? (
          <>
            <h2 className="text-xl font-bold text-white mb-1">Tudo certo! ✨</h2>
            <p className="text-sm text-white/60">Agora eu te aviso por aqui. Boa aula, Emily!</p>
          </>
        ) : status === "ios-install" ? (
          <>
            <h2 className="text-xl font-bold text-white mb-2">Quase la, Emily!</h2>
            <p className="text-sm text-white/60 mb-4 leading-relaxed">
              No iPhone as notificacoes so funcionam com o Luma instalado. Toque em <span className="text-white font-semibold">Compartilhar</span> <span className="text-white/40">(quadrado com seta)</span> &rarr; <span className="text-white font-semibold">Adicionar a Tela de Inicio</span>, e abra o Luma por la.
            </p>
            <button onClick={closeModal} className="w-full py-3 rounded-xl text-sm font-bold" style={{ background: "#8b5cf6", color: "#fff" }}>Entendi</button>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold text-white mb-2">
              {status === "default" ? "Posso te avisar?" : "Vamos reativar as notificacoes?"}
            </h2>
            <p className="text-sm text-white/60 mb-1 leading-relaxed">
              {status === "default"
                ? "Quero te lembrar de revisar os conteudos e te desejar boa aula. Permite que eu te mande notificacoes?"
                : "Voce ja permitiu, mas este aparelho nao ficou registrado. Toque abaixo pra eu tentar de novo."}
            </p>
            {errorMsg && status !== "default" && (
              <p className="text-[11px] text-amber-300/80 mb-1 break-words">Erro anterior: {errorMsg}</p>
            )}
            <p className="text-[11px] text-white/35 mb-5">Depois de tocar, o navegador vai perguntar: escolha <span className="text-white/60 font-semibold">Permitir</span>.</p>
            <div className="flex flex-col gap-2">
              <button onClick={handleAllow} disabled={loading} className="w-full py-3 rounded-xl text-sm font-bold transition-opacity" style={{ background: "#8b5cf6", color: "#fff", boxShadow: "0 8px 24px rgba(139,92,246,0.35)", opacity: loading ? 0.7 : 1 }}>
                {loading ? "Aguardando o navegador..." : "Permitir notificacoes"}
              </button>
              <button onClick={closeModal} disabled={loading} className="w-full py-2.5 rounded-xl text-sm font-semibold" style={{ color: "rgba(255,255,255,0.45)" }}>
                Agora nao
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );

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
        {modal}
      </div>
    );
  }

  // Convites (default / iOS / bloqueado) podem ser dispensados; falhas nao
  const dismissable = status === "default" || status === "ios-install" || status === "denied";
  if (dismissable && dismissed) return modal;

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
    <>
    {modal}
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
    </>
  );
}
