import { useEffect, useRef, useState } from 'react';

export function useStopwatch(startedAtIso: string): number {
  const [elapsed, setElapsed] = useState(() => Math.floor((Date.now() - Date.parse(startedAtIso)) / 1000));
  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - Date.parse(startedAtIso)) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [startedAtIso]);
  return elapsed;
}

export function formatDuration(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export interface CountdownState {
  running: boolean;
  remaining: number;
  total: number;
  start: (seconds: number) => void;
  add: (seconds: number) => void;
  skip: () => void;
  cancel: () => void;
}

export function useCountdown(onZero?: () => void): CountdownState {
  const [total, setTotal] = useState(0);
  const [endAt, setEndAt] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(0);
  const onZeroRef = useRef(onZero);
  onZeroRef.current = onZero;

  useEffect(() => {
    if (endAt === null) return;
    const tick = () => {
      const ms = endAt - Date.now();
      const r = Math.max(0, Math.ceil(ms / 1000));
      setRemaining(r);
      if (ms <= 0) {
        setEndAt(null);
        onZeroRef.current?.();
      }
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [endAt]);

  return {
    running: endAt !== null,
    remaining,
    total,
    start: (seconds: number) => {
      setTotal(seconds);
      setEndAt(Date.now() + seconds * 1000);
      setRemaining(seconds);
    },
    add: (seconds: number) => {
      if (endAt === null) return;
      setEndAt(endAt + seconds * 1000);
      setTotal((t) => t + seconds);
    },
    skip: () => {
      setEndAt(null);
      setRemaining(0);
      onZeroRef.current?.();
    },
    cancel: () => {
      setEndAt(null);
      setRemaining(0);
    },
  };
}

let audioCtx: AudioContext | null = null;

export function beep(audioEnabled: boolean, kind: 'soft' | 'strong' = 'soft'): void {
  if (!audioEnabled) return;
  try {
    if (!audioCtx) audioCtx = new AudioContext();
    const ctx = audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = kind === 'strong' ? 880 : 660;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.01);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
    osc.start();
    osc.stop(ctx.currentTime + 0.22);
  } catch {
    // no audio context available — silently skip
  }
}
