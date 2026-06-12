"use client";

import { useCallback, useRef, useState } from "react";

export function useDashboardAudio() {
  const [unlocked, setUnlocked] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);

  const unlock = useCallback(() => {
    if (unlocked) return;
    ctxRef.current = new AudioContext();
    setUnlocked(true);
  }, [unlocked]);

  const playNotification = useCallback(() => {
    if (!ctxRef.current || !unlocked) return;
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
  }, [unlocked]);

  return { unlocked, unlock, playNotification };
}
