"use client";

import { useState, useCallback, useEffect } from "react";
import { supabase, LUMA_USER_ID } from "@/lib/supabase";

const SUPABASE_URL = "https://vnrfzgbqiagxidcaeanr.supabase.co";

export type PushStatus =
  | "loading"      // ainda verificando
  | "unsupported"  // navegador sem Web Push
  | "ios-install"  // iPhone/iPad fora da tela inicial (Safari exige PWA instalado)
  | "default"      // nunca pediu permissao
  | "denied"       // usuario bloqueou no navegador
  | "active"       // permissao ok + inscricao salva no banco
  | "inactive"     // permissao ok mas nao conseguiu inscrever/salvar
  | "error";       // falhou ao ativar

function isIOS() {
  return typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);
}
function isStandalone() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true;
}
function pushSupported() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && typeof Notification !== "undefined";
}
function unsupportedStatus(): PushStatus {
  return isIOS() && !isStandalone() ? "ios-install" : "unsupported";
}

// `serviceWorker.ready` trava pra sempre se o SW nunca registrou -> garante o registro e aplica timeout
async function getRegistration(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration("/");
  if (!existing) await navigator.serviceWorker.register("/sw.js");
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Service worker nao ficou pronto (timeout)")), 10000)
  );
  return Promise.race([navigator.serviceWorker.ready, timeout]);
}

async function subscribeWithVapid(reg: ServiceWorkerRegistration): Promise<PushSubscription> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/get-vapid-public-key`);
  if (!res.ok) throw new Error(`Falha ao buscar chave VAPID (${res.status})`);
  const { publicKey } = await res.json();
  if (!publicKey) throw new Error("Chave VAPID vazia");
  return reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) });
}

async function hasDbRow(endpoint: string) {
  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("id")
    .eq("app", "luma")
    .eq("endpoint", endpoint)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return !!data;
}

// A tabela push_subscriptions e compartilhada com outros apps e tem UNIQUE(user_id).
// O Luma usa um user_id fixo e exclusivo, entao o upsert por user_id so toca a linha do Luma.
async function saveSubscription(subscription: PushSubscription) {
  const sub = subscription.toJSON();
  if (!sub.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) throw new Error("Inscricao sem endpoint/chaves");
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: LUMA_USER_ID,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      app: "luma",
      tz_offset_minutes: new Date().getTimezoneOffset(),
    },
    { onConflict: "user_id" }
  );
  if (error) throw new Error(error.message);
}

async function ensureSubscribed(): Promise<void> {
  const reg = await getRegistration();
  let sub = await reg.pushManager.getSubscription();
  if (!sub) sub = await subscribeWithVapid(reg);
  if (!(await hasDbRow(sub.endpoint))) await saveSubscription(sub);
}

export function usePushNotifications() {
  const [status, setStatus] = useState<PushStatus>("loading");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-reparo: se a permissao ja foi concedida mas a inscricao/linha no banco sumiu, refaz em silencio
  const refresh = useCallback(async () => {
    if (!pushSupported()) { setStatus(unsupportedStatus()); return; }
    const perm = Notification.permission;
    if (perm === "denied") { setStatus("denied"); return; }
    if (perm === "default") { setStatus("default"); return; }
    try {
      await ensureSubscribed();
      setErrorMsg(null);
      setStatus("active");
    } catch (e) {
      console.error("[push] auto-reparo falhou:", e);
      setErrorMsg((e as Error)?.message || String(e));
      setStatus("inactive");
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const requestPermission = useCallback(async () => {
    if (!pushSupported()) { setStatus(unsupportedStatus()); return false; }
    setLoading(true);
    setErrorMsg(null);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { setStatus(perm === "denied" ? "denied" : "default"); return false; }
      await ensureSubscribed();
      setStatus("active");
      return true;
    } catch (e) {
      console.error("[push] ativar falhou:", e);
      setErrorMsg((e as Error)?.message || String(e));
      setStatus("error");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const sendTest = useCallback(async (): Promise<{ ok: boolean; message: string }> => {
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/luma-notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Teste do Luma \u{1F43C}", body: "Se voce esta vendo isso, as notificacoes estao funcionando!", url: "/" }),
      });
      const json = await res.json();
      if (json.error) return { ok: false, message: json.error };
      if (!json.total) return { ok: false, message: "Nenhum dispositivo inscrito no banco" };
      if (json.failed?.length) return { ok: false, message: `Falhou: ${json.failed.join(", ")}` };
      return { ok: true, message: `Enviado para ${json.sent} dispositivo${json.sent === 1 ? "" : "s"}` };
    } catch (e) {
      return { ok: false, message: (e as Error)?.message || String(e) };
    }
  }, []);

  return { status, loading, errorMsg, requestPermission, refresh, sendTest };
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}
