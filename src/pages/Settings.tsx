import { useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useSettings } from '../lib/settings';
import { clearAll, downloadExport, importBundle, type ImportMode } from '../lib/exportImport';
import { db } from '../lib/db';
import type { DriftRuleId, ScheduleSlot } from '../lib/types';
import type { WeekdayKey } from '../lib/date';
import { IconExport, IconPlus } from '../components/Icons';

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

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      className={`toggle${on ? ' toggle-on' : ''}`}
      onClick={() => onChange(!on)}
      aria-pressed={on}
    >
      <span className="toggle-knob" />
    </button>
  );
}

export function Settings() {
  const [settings, setSettings] = useSettings();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importMode, setImportMode] = useState<ImportMode>('replace');
  const [status, setStatus] = useState<string | null>(null);

  const routines = useLiveQuery(() => db.routines.orderBy('name').toArray(), []);
  const sessionsCount = useLiveQuery(() => db.sessions.count(), []) ?? 0;
  const nutritionCount = useLiveQuery(() => db.nutrition.count(), []) ?? 0;
  const weightsCount = useLiveQuery(() => db.weights.count(), []) ?? 0;

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

  const initial = (settings.displayName || 'M').trim().charAt(0).toUpperCase();
  const lastExportLabel = settings.lastExportAt
    ? formatRelativeDays(settings.lastExportAt)
    : 'never';

  return (
    <div className="page page-settings">
      <section className="head-row">
        <div>
          <span className="page-eyebrow eyebrow-settings">Profile & settings</span>
          <h1 className="page-title">{settings.displayName || 'Your account'}</h1>
          <p className="page-sub">Edit goals, schedule, notifications, and your local data.</p>
        </div>
        <div className="head-actions">
          <button className="ghost-btn" onClick={() => downloadExport()}>
            <IconExport size={14} stroke={1.7} /> Export
          </button>
          <button className="cta-btn" onClick={() => downloadExport()}>
            <IconPlus size={14} stroke={2} /> Save changes
          </button>
        </div>
      </section>

      <div className="settings-grid">
        {/* Profile */}
        <div className="settings-card settings-card-wide">
          <span className="settings-eyebrow">Profile</span>
          <h2 className="settings-section-title">You</h2>
          <p className="settings-help">A name we'll greet you with on the dashboard.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '96px 1fr', gap: 24, alignItems: 'flex-start' }}>
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: '50%',
                background: 'var(--ink)',
                color: 'var(--bg)',
                display: 'grid',
                placeItems: 'center',
                fontFamily: 'var(--font-display)',
                fontSize: 44,
                fontWeight: 500,
                letterSpacing: '-0.02em',
              }}
            >
              {initial}
            </div>
            <div>
              <div className="field">
                <span className="field-label">Display name</span>
                <input
                  type="text"
                  value={settings.displayName}
                  onChange={(e) => setSettings({ ...settings, displayName: e.target.value })}
                  placeholder="What should we call you?"
                />
              </div>
              <div style={{ display: 'flex', gap: 28, marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--hairline)' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 500, lineHeight: 1 }}>{sessionsCount}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>sessions</div>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 500, lineHeight: 1 }}>{nutritionCount}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>food entries</div>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 500, lineHeight: 1 }}>{weightsCount}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>weight entries</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Goals */}
        <div className="settings-card">
          <span className="settings-eyebrow">Goals</span>
          <h2 className="settings-section-title">Daily targets</h2>
          <p className="settings-help">Drives the rings on the dashboard and the drift rules.</p>
          <div className="goal-grid">
            <label className="goal-field">
              <span className="goal-label"><span className="goal-swatch" style={{ background: 'var(--kcal)' }} /> Calories <em>kcal</em></span>
              <input type="number" min={0} value={settings.goals.kcalDaily} onChange={(e) => updateGoal('kcalDaily', Number(e.target.value))} />
            </label>
            <label className="goal-field">
              <span className="goal-label"><span className="goal-swatch" style={{ background: 'var(--protein)' }} /> Protein <em>g</em></span>
              <input type="number" min={0} value={settings.goals.proteinDaily} onChange={(e) => updateGoal('proteinDaily', Number(e.target.value))} />
            </label>
            <label className="goal-field">
              <span className="goal-label"><span className="goal-swatch" style={{ background: 'var(--steps)' }} /> Steps</span>
              <input type="number" min={0} value={settings.goals.stepsDaily} onChange={(e) => updateGoal('stepsDaily', Number(e.target.value))} />
            </label>
            <label className="goal-field">
              <span className="goal-label">Weekly workouts</span>
              <input type="number" min={0} max={7} value={settings.goals.weeklyWorkouts} onChange={(e) => updateGoal('weeklyWorkouts', Number(e.target.value))} />
            </label>
            <label className="goal-field">
              <span className="goal-label">Weight goal <em>kg, optional</em></span>
              <input
                type="number"
                min={0}
                step={0.1}
                value={settings.goals.weightGoalKg ?? ''}
                onChange={(e) => updateGoal('weightGoalKg', e.target.value === '' ? undefined : Number(e.target.value))}
              />
            </label>
            <label className="goal-field">
              <span className="goal-label">Weigh-ins / week</span>
              <input type="number" min={0} max={7} value={settings.goals.weighInsPerWeek} onChange={(e) => updateGoal('weighInsPerWeek', Number(e.target.value))} />
            </label>
          </div>
        </div>

        {/* Weekly schedule */}
        <div className="settings-card">
          <span className="settings-eyebrow">Schedule</span>
          <h2 className="settings-section-title">Weekly routine</h2>
          <p className="settings-help">Picks today's workout on the dashboard. Monday-first.</p>
          <div className="schedule-list">
            {WEEKDAYS.map((d) => (
              <div key={d.key} className="schedule-row">
                <span className="schedule-day">{d.label}</span>
                <select
                  className="schedule-select"
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

        {/* Drift notifications */}
        <div className="settings-card settings-card-wide">
          <span className="settings-eyebrow">Notifications</span>
          <h2 className="settings-section-title">Drift signals</h2>
          <p className="settings-help">One signal at a time on the dashboard. Each is dismissible for 24 hours.</p>
          <ul className="drift-rules">
            {DRIFT_RULE_LABELS.map((r, i) => (
              <li key={r.id} className="drift-rule">
                <span className="drift-rule-num">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <div className="drift-rule-label">{r.label}</div>
                  <div className="drift-rule-desc">{r.description}</div>
                </div>
                <Toggle on={settings.driftRules[r.id]} onChange={(v) => setDriftRule(r.id, v)} />
              </li>
            ))}
          </ul>
        </div>

        {/* Audio */}
        <div className="settings-card">
          <span className="settings-eyebrow">Audio</span>
          <h2 className="settings-section-title">Session beeps</h2>
          <p className="settings-help">Soft tone at each rest-timer zero and rowing phase change.</p>
          <div className="toggle-row">
            <span>Play beeps during workouts</span>
            <Toggle on={settings.audioEnabled} onChange={(v) => setSettings({ ...settings, audioEnabled: v })} />
          </div>
        </div>

        {/* Data */}
        <div className="settings-card">
          <span className="settings-eyebrow">Data</span>
          <h2 className="settings-section-title">Backup & restore</h2>
          <p className="settings-help">All data lives in this browser only. Export regularly. Last export: {lastExportLabel}.</p>
          <div className="data-actions">
            <button className="ghost-btn" onClick={() => downloadExport()}>
              <IconExport size={14} stroke={1.7} /> Export JSON
            </button>
            <select
              className="schedule-select"
              value={importMode}
              onChange={(e) => setImportMode(e.target.value as ImportMode)}
              style={{ minWidth: 0 }}
            >
              <option value="replace">Replace</option>
              <option value="merge">Merge</option>
            </select>
            <button className="ghost-btn" onClick={() => fileRef.current?.click()}>
              Import…
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
            <button className="ghost-btn ghost-btn-danger" onClick={onClear}>
              Clear all data
            </button>
          </div>
          {status && <p className="muted" style={{ marginTop: 12, fontSize: 13 }}>{status}</p>}
        </div>
      </div>
    </div>
  );
}

function formatRelativeDays(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  return new Date(iso).toLocaleDateString();
}
