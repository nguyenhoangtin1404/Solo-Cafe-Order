"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useDashboardAudio() {
  const [unlocked, setUnlocked] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const mountedRef = useRef(true);

  const unlock = useCallback(async () => {
    if (ctxRef.current) return;
    const ctx = new AudioContext();
    ctxRef.current = ctx;
    // iOS Safari starts AudioContext in suspended state even inside a user
    // gesture. Only signal unlocked when the context is actually running so
    // the banner stays visible if resume() fails.
    await ctx.resume().catch(() => null);
    if (mountedRef.current && ctx.state === "running") setUnlocked(true);
  }, []);

  // Reads from refs directly so the callback is stable and never stale.
  const playNotification = useCallback(() => {
    if (!ctxRef.current || ctxRef.current.state !== "running") return;
    if (document.visibilityState !== "visible") return;

    const ctx = ctxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(660, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  }, []);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      ctxRef.current?.close();
      ctxRef.current = null;
    };
  }, []);

  return { unlocked, unlock, playNotification };
}
