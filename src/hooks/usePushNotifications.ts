"use client";

import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthProvider";

const SUPABASE_URL = "https://vnrfzgbqiagxidcaeanr.supabase.co";
const DEVICE_KEY = "luma_device_id";

// Cada aparelho tem seu proprio id (uuid aleatorio guardado no navegador). A tabela
// push_subscriptions e compartilhada e tem UNIQUE(user_id); usando um id por aparelho,
// varios celulares do Luma convivem sem colidir com os usuarios dos outros apps.
export function getDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

function deviceLabel(): string {
  const ua = navigator.userAgent;
  const os = /iphone/i.test(ua) ? "iPhone" : /ipad/i.test(ua) ? "iPad" : /android/i.test(ua) ? "Android" : /mac os x/i.test(ua) ? "Mac" : /windows/i.test(ua) ? "Windows" : "Outro";
  const browser = /crios|chrome/i.test(ua) && !/edg/i.test(ua) ? "Chrome" : /safari/i.test(ua) ? "Safari" : /firefox|fxios/i.test(ua) ? "Firefox" : /edg/i.test(ua) ? "Edge" : "";
  return [os, browser].filter(Boolean).join(" · ");
}

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

async function hasDbRow(endpoint: string, deviceId: string) {
  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("id, user_id")
    .eq("app", "luma")
    .eq("endpoint", endpoint);
  if (error) throw new Error(error.message);
  // precisa existir a linha DESTE aparelho (id por aparelho); linhas antigas do mesmo endpoint sao trocadas
  return (data || []).some((r) => r.user_id === deviceId) && (data || []).length === 1;
}

async function saveSubscription(subscription: PushSubscription, deviceId: string, email: string | null) {
  const sub = subscription.toJSON();
  if (!sub.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) throw new Error("Inscricao sem endpoint/chaves");
  // Remove registros antigos do Luma para este mesmo endpoint (ex.: o user_id fixo de antes),
  // evitando push duplicado no mesmo aparelho. So toca linhas app='luma'.
  await supabase.from("push_subscriptions").delete().eq("app", "luma").eq("endpoint", sub.endpoint).neq("user_id", deviceId);
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: deviceId,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      app: "luma",
      tz_offset_minutes: new Date().getTimezoneOffset(),
    },
    { onConflict: "user_id" }
  );
  if (error) throw new Error(error.message);
  await supabase.from("luma_devices").upsert(
    { device_id: deviceId, email, user_agent: navigator.userAgent.slice(0, 300), label: deviceLabel(), last_seen_at: new Date().toISOString() },
    { onConflict: "device_id" }
  );
}

async function ensureSubscribed(email: string | null): Promise<void> {
  const deviceId = getDeviceId();
  const reg = await getRegistration();
  let sub = await reg.pushManager.getSubscription();
  if (!sub) sub = await subscribeWithVapid(reg);
  if (!(await hasDbRow(sub.endpoint, deviceId))) await saveSubscription(sub, deviceId, email);
  else await supabase.from("luma_devices").upsert({ device_id: deviceId, email, label: deviceLabel(), last_seen_at: new Date().toISOString() }, { onConflict: "device_id" });
}

export function usePushNotifications() {
  const { user } = useAuth();
  const email = user?.email ?? null;
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
      await ensureSubscribed(email);
      setErrorMsg(null);
      setStatus("active");
    } catch (e) {
      console.error("[push] auto-reparo falhou:", e);
      setErrorMsg((e as Error)?.message || String(e));
      setStatus("inactive");
    }
  }, [email]);

  useEffect(() => { refresh(); }, [refresh]);

  const requestPermission = useCallback(async () => {
    if (!pushSupported()) { setStatus(unsupportedStatus()); return false; }
    setLoading(true);
    setErrorMsg(null);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { setStatus(perm === "denied" ? "denied" : "default"); return false; }
      await ensureSubscribed(email);
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
  }, [email]);

  const sendTest = useCallback(async (): Promise<{ ok: boolean; message: string }> => {
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/luma-notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Teste do Luma \u{1F43C}", body: "Se voce esta vendo isso, as notificacoes estao funcionando!", url: "/", source: "test" }),
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
