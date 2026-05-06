import { useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useSettings } from '../lib/settings';
import { clearAll, downloadExport, importBundle, type ImportMode } from '../lib/exportImport';
import { db } from '../lib/db';
import type { DriftRuleId, ScheduleSlot } from '../lib/types';
import type { WeekdayKey } from '../lib/date';

const DRIFT_RULE_LABELS: { id: DriftRuleId; label: string; description: string }[] = [
  { id: 'overdueCheckup', label: 'Overdue checkup', description: 'When any checkup is overdue by 30+ days.' },
  { id: 'missedWorkouts', label: 'Missed workouts', description: 'When fewer than 2 sessions in the last 7 days (and weekly goal is ≥3).' },
  { id: 'proteinLow', label: 'Protein trending low', description: '7-day average protein under 85% of your goal.' },
  { id: 'kcalHigh', label: 'Calories trending high', description: '7-day average calories over 115% of your goal.' },
  { id: 'weightTrend', label: 'Weight trend', description: '14-day rolling average has shifted opposite to your goal direction by ≥1.5%.' },
  { id: 'longGap', label: 'Long gap', description: 'No logging activity in 3+ days.' },
  { id: 'exportReminder', label: '30-day export reminder', description: "Reminds you to export your data when it's been a month since your last export." },
];

const WEEKDAYS: { key: WeekdayKey; label: string }[] = [
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' },
  { key: 'fri', label: 'Fri' },
  { key: 'sat', label: 'Sat' },
  { key: 'sun', label: 'Sun' },
];

function slotToValue(slot: ScheduleSlot): string {
  if (slot.kind === 'rest') return '__rest';
  if (slot.kind === 'active-recovery') return '__active';
  return slot.routineId;
}

function valueToSlot(value: string): ScheduleSlot {
  if (value === '__rest') return { kind: 'rest' };
  if (value === '__active') return { kind: 'active-recovery' };
  return { kind: 'routine', routineId: value };
}

export function Settings() {
  const [settings, setSettings] = useSettings();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importMode, setImportMode] = useState<ImportMode>('replace');
  const [status, setStatus] = useState<string | null>(null);

  const routines = useLiveQuery(() => db.routines.orderBy('name').toArray(), []);

  const updateGoal = <K extends keyof typeof settings.goals>(key: K, value: typeof settings.goals[K]) => {
    setSettings({ ...settings, goals: { ...settings.goals, [key]: value } });
  };

  const setSlot = (day: WeekdayKey, slot: ScheduleSlot) => {
    setSettings({ ...settings, weeklySchedule: { ...settings.weeklySchedule, [day]: slot } });
  };

  const setDriftRule = (id: DriftRuleId, enabled: boolean) => {
    setSettings({ ...settings, driftRules: { ...settings.driftRules, [id]: enabled } });
  };

  const onPickFile = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      await importBundle(parsed, importMode);
      setStatus(`Imported (${importMode}).`);
    } catch (err) {
      setStatus('Import failed: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const onClear = async () => {
    if (!confirm('Clear all data? This cannot be undone.')) return;
    if (!confirm('Really clear everything?')) return;
    await clearAll();
    setStatus('All data cleared.');
  };

  return (
    <main className="page">
      <div className="section">
        <h1>Settings</h1>
        <p className="muted">Configure your profile, goals, and data.</p>
      </div>

      <div className="card section">
        <h2>Profile</h2>
        <div className="field">
          <label htmlFor="displayName">Display name</label>
          <input
            id="displayName"
            type="text"
            value={settings.displayName}
            onChange={(e) => setSettings({ ...settings, displayName: e.target.value })}
            placeholder="What should we call you?"
          />
        </div>
      </div>

      <div className="card section">
        <h2>Daily goals</h2>
        <div className="row">
          <div className="field">
            <label htmlFor="kcal">Calories (kcal)</label>
            <input
              id="kcal"
              type="number"
              min={0}
              value={settings.goals.kcalDaily}
              onChange={(e) => updateGoal('kcalDaily', Number(e.target.value))}
            />
          </div>
          <div className="field">
            <label htmlFor="protein">Protein (g)</label>
            <input
              id="protein"
              type="number"
              min={0}
              value={settings.goals.proteinDaily}
              onChange={(e) => updateGoal('proteinDaily', Number(e.target.value))}
            />
          </div>
          <div className="field">
            <label htmlFor="steps">Steps</label>
            <input
              id="steps"
              type="number"
              min={0}
              value={settings.goals.stepsDaily}
              onChange={(e) => updateGoal('stepsDaily', Number(e.target.value))}
            />
          </div>
        </div>
        <div className="row">
          <div className="field">
            <label htmlFor="weekly">Weekly workouts</label>
            <input
              id="weekly"
              type="number"
              min={0}
              max={7}
              value={settings.goals.weeklyWorkouts}
              onChange={(e) => updateGoal('weeklyWorkouts', Number(e.target.value))}
            />
          </div>
          <div className="field">
            <label htmlFor="weight">Weight goal (kg, optional)</label>
            <input
              id="weight"
              type="number"
              min={0}
              step={0.1}
              value={settings.goals.weightGoalKg ?? ''}
              onChange={(e) => updateGoal('weightGoalKg', e.target.value === '' ? undefined : Number(e.target.value))}
            />
          </div>
          <div className="field">
            <label htmlFor="weighIn">Weigh-ins per week</label>
            <input
              id="weighIn"
              type="number"
              min={0}
              max={7}
              value={settings.goals.weighInsPerWeek}
              onChange={(e) => updateGoal('weighInsPerWeek', Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      <div className="card section">
        <h2>Weekly schedule</h2>
        <p className="muted">Sets the dashboard's default routine for each day. Mondays start the week.</p>
        <div className="stack" style={{ gap: 'var(--space-2)' }}>
          {WEEKDAYS.map((d) => (
            <div key={d.key} className="row" style={{ alignItems: 'center' }}>
              <strong style={{ flex: '0 0 60px' }}>{d.label}</strong>
              <select
                value={slotToValue(settings.weeklySchedule[d.key])}
                onChange={(e) => setSlot(d.key, valueToSlot(e.target.value))}
              >
                <option value="__rest">Rest</option>
                <option value="__active">Active recovery</option>
                {routines?.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      <div className="card section">
        <h2>Notifications</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          The dashboard surfaces one drift signal at a time. Each is dismissible for 24 hours.
        </p>
        <div className="stack" style={{ gap: 'var(--space-3)' }}>
          {DRIFT_RULE_LABELS.map((r) => (
            <label key={r.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
              <input
                type="checkbox"
                checked={settings.driftRules[r.id]}
                onChange={(e) => setDriftRule(r.id, e.target.checked)}
                style={{ marginTop: 4 }}
              />
              <span>
                <span style={{ fontWeight: 500 }}>{r.label}</span>
                <span className="muted" style={{ display: 'block', fontSize: '0.85rem' }}>{r.description}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="card section">
        <h2>Audio</h2>
        <label style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={settings.audioEnabled}
            onChange={(e) => setSettings({ ...settings, audioEnabled: e.target.checked })}
          />
          Session player beeps (rest timer end, interval transitions)
        </label>
      </div>

      <div className="card section">
        <h2>Data</h2>
        <p className="muted">All data lives in this browser. Export regularly.</p>
        <div className="row" style={{ marginBottom: 'var(--space-4)' }}>
          <button className="btn btn-primary" onClick={() => downloadExport()}>
            Export all data
          </button>
        </div>
        <div className="field">
          <label>Import mode</label>
          <select value={importMode} onChange={(e) => setImportMode(e.target.value as ImportMode)}>
            <option value="replace">Replace — wipe and load</option>
            <option value="merge">Merge — combine with current data</option>
          </select>
        </div>
        <div className="row" style={{ marginBottom: 'var(--space-4)' }}>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            Import from JSON…
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onPickFile(file);
              e.target.value = '';
            }}
          />
        </div>
        <div className="row">
          <button className="btn btn-danger" onClick={onClear}>
            Clear all data
          </button>
        </div>
        {settings.lastExportAt && (
          <p className="muted" style={{ marginTop: 'var(--space-3)' }}>
            Last export: {new Date(settings.lastExportAt).toLocaleString()}
          </p>
        )}
        {status && (
          <p style={{ marginTop: 'var(--space-3)', color: 'var(--color-info)' }}>{status}</p>
        )}
      </div>
    </main>
  );
}
