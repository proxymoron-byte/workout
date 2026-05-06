import { useEffect, useState } from 'react';
import type { Settings } from './types';
import { SCHEMA_VERSION } from './db';

const KEY = 'workout.settings.v1';

export const DEFAULT_SETTINGS: Settings = {
  schemaVersion: SCHEMA_VERSION,
  displayName: '',
  goals: {
    kcalDaily: 2000,
    proteinDaily: 130,
    stepsDaily: 8000,
    weeklyWorkouts: 3,
    weighInsPerWeek: 3,
  },
  weeklySchedule: {
    mon: { kind: 'rest' },
    tue: { kind: 'rest' },
    wed: { kind: 'rest' },
    thu: { kind: 'rest' },
    fri: { kind: 'rest' },
    sat: { kind: 'rest' },
    sun: { kind: 'rest' },
  },
  driftRules: {
    overdueCheckup: true,
    missedWorkouts: true,
    proteinLow: true,
    kcalHigh: true,
    weightTrend: false,
    longGap: true,
    exportReminder: true,
  },
  audioEnabled: true,
  checkupsDisclaimerSeen: false,
};

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return { ...DEFAULT_SETTINGS, ...parsed, goals: { ...DEFAULT_SETTINGS.goals, ...(parsed.goals ?? {}) } };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: Settings): void {
  localStorage.setItem(KEY, JSON.stringify(s));
  window.dispatchEvent(new CustomEvent('workout:settings-changed'));
}

export function useSettings(): [Settings, (next: Settings) => void] {
  const [settings, setSettings] = useState<Settings>(() => loadSettings());

  useEffect(() => {
    const onChange = () => setSettings(loadSettings());
    window.addEventListener('workout:settings-changed', onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener('workout:settings-changed', onChange);
      window.removeEventListener('storage', onChange);
    };
  }, []);

  const update = (next: Settings) => {
    saveSettings(next);
    setSettings(next);
  };

  return [settings, update];
}
