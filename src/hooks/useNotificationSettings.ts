"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase, LUMA_USER_ID } from "@/lib/supabase";

export interface NotificationSettings {
  enabled3d: boolean;
  enabled1d: boolean;
  enabledMorning: boolean;
  enabledBefore: boolean;
  time3d: string;        // "HH:MM"
  time1d: string;
  timeMorning: string;
  minutesBefore: number;
  defaultEventTime: string; // "HH:MM" usado quando o lembrete nao tem horario
}

export const DEFAULT_SETTINGS: NotificationSettings = {
  enabled3d: true, enabled1d: true, enabledMorning: true, enabledBefore: true,
  time3d: "09:00", time1d: "19:00", timeMorning: "07:30", minutesBefore: 30, defaultEventTime: "19:15",
};

const hhmm = (t: any, fallback: string) => (t ? String(t).slice(0, 5) : fallback);

export function useNotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    supabase.from("luma_notification_settings").select("*").eq("user_id", LUMA_USER_ID).maybeSingle().then(({ data }) => {
      if (data) {
        setSettings({
          enabled3d: data.enabled_3d ?? true, enabled1d: data.enabled_1d ?? true, enabledMorning: data.enabled_morning ?? true, enabledBefore: data.enabled_before ?? true,
          time3d: hhmm(data.time_3d, "09:00"), time1d: hhmm(data.time_1d, "19:00"), timeMorning: hhmm(data.time_morning, "07:30"),
          minutesBefore: data.minutes_before ?? 30, defaultEventTime: hhmm(data.default_event_time, "19:15"),
        });
      }
      setLoaded(true);
    });
  }, []);

  const update = useCallback((patch: Partial<NotificationSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(async () => {
        setSaving(true);
        await supabase.from("luma_notification_settings").upsert({
          user_id: LUMA_USER_ID,
          enabled_3d: next.enabled3d, enabled_1d: next.enabled1d, enabled_morning: next.enabledMorning, enabled_before: next.enabledBefore,
          time_3d: next.time3d, time_1d: next.time1d, time_morning: next.timeMorning,
          minutes_before: next.minutesBefore, default_event_time: next.defaultEventTime || null,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });
        setSaving(false);
      }, 600);
      return next;
    });
  }, []);

  return { settings, loaded, saving, update };
}
