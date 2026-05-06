import { useRef, useState } from 'react';
import { useSettings } from '../lib/settings';
import { clearAll, downloadExport, importBundle, type ImportMode } from '../lib/exportImport';

export function Settings() {
  const [settings, setSettings] = useSettings();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importMode, setImportMode] = useState<ImportMode>('replace');
  const [status, setStatus] = useState<string | null>(null);

  const updateGoal = <K extends keyof typeof settings.goals>(key: K, value: typeof settings.goals[K]) => {
    setSettings({ ...settings, goals: { ...settings.goals, [key]: value } });
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
