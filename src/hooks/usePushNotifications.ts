"use client";

import { useState, useCallback } from "react";
import { supabase, LUMA_USER_ID } from "@/lib/supabase";

const SUPABASE_URL = "https://vnrfzgbqiagxidcaeanr.supabase.co";

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );
  const [loading, setLoading] = useState(false);

  const requestPermission = useCallback(async () => {
    if (typeof Notification === "undefined") return false;
    setLoading(true);

    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") { setLoading(false); return false; }

      // Get VAPID public key
      const vapidRes = await fetch(`${SUPABASE_URL}/functions/v1/get-vapid-public-key`);
      const { publicKey } = await vapidRes.json();

      // Subscribe to push
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const sub = subscription.toJSON();

      // Save directly to table (matching existing schema: endpoint, p256dh, auth)
      await supabase.from("push_subscriptions").upsert({
        user_id: LUMA_USER_ID,
        endpoint: sub.endpoint,
        p256dh: sub.keys?.p256dh,
        auth: sub.keys?.auth,
      }, { onConflict: "user_id" });

      setLoading(false);
      return true;
    } catch (e) {
      console.error("Push error:", e);
      setLoading(false);
      return false;
    }
  }, []);

  return { permission, loading, requestPermission };
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}
