import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, useState } from 'react';
import { db, newId } from '../lib/db';
import type { MealTag, NutritionEntry } from '../lib/types';
import { addDaysCET, lastNDaysCET, todayCET } from '../lib/date';
import { useSettings } from '../lib/settings';
import { Modal } from '../components/Modal';
import { Link } from 'react-router-dom';

const MEAL_TAGS: MealTag[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export function Nutrition() {
  const [settings] = useSettings();
  const [date, setDate] = useState<string>(todayCET());
  const [editing, setEditing] = useState<NutritionEntry | null>(null);

  const allEntries = useLiveQuery(() => db.nutrition.toArray(), []);
  const todayEntries = useMemo(
    () => (allEntries ?? []).filter((e) => e.date === date).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [allEntries, date],
  );

  const totals = useMemo(() => {
    const kcal = todayEntries.reduce((s, e) => s + e.kcal, 0);
    const protein = todayEntries.reduce((s, e) => s + e.proteinG, 0);
    return { kcal, protein };
  }, [todayEntries]);

  const week = useMemo(() => {
    const days = lastNDaysCET(7, date);
    return days.map((d) => {
      const ents = (allEntries ?? []).filter((e) => e.date === d);
      return {
        date: d,
        kcal: ents.reduce((s, e) => s + e.kcal, 0),
        protein: ents.reduce((s, e) => s + e.proteinG, 0),
      };
    });
  }, [allEntries, date]);

  const goalsSet = settings.goals.kcalDaily > 0 || settings.goals.proteinDaily > 0;

  const onAdd = () => {
    setEditing({
      id: newId(),
      date,
      name: '',
      kcal: 0,
      proteinG: 0,
      createdAt: new Date().toISOString(),
    });
  };

  const onSave = async (entry: NutritionEntry) => {
    await db.nutrition.put(entry);
    setEditing(null);
  };

  const onDelete = async (id: string) => {
    if (!confirm('Delete this entry?')) return;
    await db.nutrition.delete(id);
  };

  const today = todayCET();
  const isToday = date === today;
  const dateLabel = isToday ? 'Today' : new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <main className="page">
      <div className="section">
        <h1>Nutrition</h1>
      </div>

      <div className="card section">
        <div className="between" style={{ marginBottom: 'var(--space-4)' }}>
          <div className="row" style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
            <button className="btn btn-icon" onClick={() => setDate(addDaysCET(date, -1))} aria-label="Previous day">←</button>
            <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
            <button
              className="btn btn-icon"
              onClick={() => setDate(addDaysCET(date, 1))}
              disabled={date >= today}
              aria-label="Next day"
            >→</button>
            {!isToday && (
              <button className="btn btn-sm" onClick={() => setDate(today)}>Today</button>
            )}
          </div>
          <button className="btn btn-primary" onClick={onAdd}>+ Add entry</button>
        </div>

        <div className="muted" style={{ fontSize: '0.85rem', marginBottom: 'var(--space-2)' }}>{dateLabel}</div>
        <div className="row" style={{ gap: 'var(--space-6)' }}>
          <Stat
            label="Calories"
            value={totals.kcal}
            unit="kcal"
            goal={settings.goals.kcalDaily}
          />
          <Stat
            label="Protein"
            value={totals.protein}
            unit="g"
            goal={settings.goals.proteinDaily}
          />
        </div>
      </div>

      {!goalsSet && (
        <div className="card empty section">
          Set your daily goals to track progress. <Link to="/settings">Open settings →</Link>
        </div>
      )}

      <div className="card section" style={{ padding: 0 }}>
        {todayEntries.length === 0 && <div className="empty">No entries for {dateLabel.toLowerCase()}.</div>}
        {todayEntries.map((e) => (
          <div key={e.id} className="list-row">
            <div>
              <div className="name">{e.name}</div>
              <div className="meta muted">
                {e.kcal} kcal · {e.proteinG} g protein{e.meal && ` · ${e.meal}`}
              </div>
            </div>
            <div className="actions">
              <button className="btn btn-sm" onClick={() => setEditing(e)}>Edit</button>
              <button className="btn btn-sm btn-danger" onClick={() => onDelete(e.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      <div className="card section">
        <h2 style={{ marginBottom: 'var(--space-4)' }}>Last 7 days</h2>
        <WeekStrip data={week} kcalGoal={settings.goals.kcalDaily} proteinGoal={settings.goals.proteinDaily} selected={date} />
      </div>

      {editing && (
        <NutritionModal
          entry={editing}
          allEntries={allEntries ?? []}
          onSave={onSave}
          onClose={() => setEditing(null)}
        />
      )}
    </main>
  );
}

function Stat({ label, value, unit, goal }: { label: string; value: number; unit: string; goal: number }) {
  const pct = goal > 0 ? Math.round((value / goal) * 100) : 0;
  return (
    <div>
      <div className="muted" style={{ fontSize: '0.85rem' }}>{label}</div>
      <div style={{ fontSize: '1.6rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
        {Math.round(value)}
        <span className="muted" style={{ fontWeight: 400, fontSize: '1rem' }}> {unit}</span>
      </div>
      {goal > 0 && (
        <div className="muted" style={{ fontSize: '0.85rem' }}>
          {pct}% of {goal} {unit} goal
        </div>
      )}
    </div>
  );
}

function WeekStrip({
  data,
  kcalGoal,
  proteinGoal,
  selected,
}: {
  data: { date: string; kcal: number; protein: number }[];
  kcalGoal: number;
  proteinGoal: number;
  selected: string;
}) {
  const kcalMax = Math.max(kcalGoal * 1.2, ...data.map((d) => d.kcal));
  const proteinMax = Math.max(proteinGoal * 1.2, ...data.map((d) => d.protein));
  return (
    <div className="stack" style={{ gap: 'var(--space-5)' }}>
      <StripRow label="Calories" unit="kcal" data={data.map((d) => ({ date: d.date, value: d.kcal }))} max={kcalMax} goal={kcalGoal} selected={selected} />
      <StripRow label="Protein" unit="g" data={data.map((d) => ({ date: d.date, value: d.protein }))} max={proteinMax} goal={proteinGoal} selected={selected} />
    </div>
  );
}

function StripRow({
  label,
  unit,
  data,
  max,
  goal,
  selected,
}: {
  label: string;
  unit: string;
  data: { date: string; value: number }[];
  max: number;
  goal: number;
  selected: string;
}) {
  const goalPct = max > 0 ? (goal / max) * 100 : 0;
  return (
    <div>
      <div className="muted" style={{ fontSize: '0.85rem', marginBottom: 'var(--space-2)' }}>{label}</div>
      <div className="strip">
        {goal > 0 && (
          <div
            className="strip-goal-line"
            style={{ bottom: `${goalPct}%` }}
            title={`Goal: ${goal} ${unit}`}
          />
        )}
        {data.map((d) => {
          const h = max > 0 ? Math.min(100, (d.value / max) * 100) : 0;
          const dayLabel = new Date(`${d.date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short' });
          return (
            <div key={d.date} className={`strip-bar-wrap${d.date === selected ? ' selected' : ''}`}>
              <div className="strip-bar" style={{ height: `${h}%` }} title={`${d.date}: ${Math.round(d.value)} ${unit}`} />
              <div className="strip-day-label muted">{dayLabel.slice(0, 1)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface SuggestedFood {
  name: string;
  kcal: number;
  proteinG: number;
}

function buildSuggestions(entries: NutritionEntry[]): SuggestedFood[] {
  const byName = new Map<string, NutritionEntry>();
  for (const e of entries) {
    const key = e.name.trim().toLowerCase();
    if (!key) continue;
    const existing = byName.get(key);
    if (!existing || e.createdAt > existing.createdAt) byName.set(key, e);
  }
  return Array.from(byName.values()).map((e) => ({ name: e.name, kcal: e.kcal, proteinG: e.proteinG }));
}

function NutritionModal({
  entry,
  allEntries,
  onSave,
  onClose,
}: {
  entry: NutritionEntry;
  allEntries: NutritionEntry[];
  onSave: (e: NutritionEntry) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<NutritionEntry>(entry);
  const [showSuggest, setShowSuggest] = useState(false);
  const set = <K extends keyof NutritionEntry>(k: K, v: NutritionEntry[K]) => setDraft({ ...draft, [k]: v });

  const allSuggestions = useMemo(() => buildSuggestions(allEntries), [allEntries]);
  const filtered = useMemo(() => {
    const q = draft.name.trim().toLowerCase();
    if (!q) return allSuggestions.slice(0, 8);
    return allSuggestions.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 8);
  }, [draft.name, allSuggestions]);

  const pick = (s: SuggestedFood) => {
    setDraft({ ...draft, name: s.name, kcal: s.kcal, proteinG: s.proteinG });
    setShowSuggest(false);
  };

  return (
    <Modal
      open
      title={entry.name ? `Edit · ${entry.name}` : 'Log food'}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={!draft.name.trim()}
            onClick={() => onSave({ ...draft, name: draft.name.trim() })}
          >
            Save
          </button>
        </>
      }
    >
      <div className="field" style={{ position: 'relative' }}>
        <label>Food</label>
        <input
          value={draft.name}
          onChange={(e) => { set('name', e.target.value); setShowSuggest(true); }}
          onFocus={() => setShowSuggest(true)}
          onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
          placeholder="Greek yogurt"
          autoFocus
        />
        {showSuggest && filtered.length > 0 && (
          <div className="suggestions">
            {filtered.map((s) => (
              <button
                key={s.name}
                type="button"
                className="suggestion"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(s)}
              >
                <span>{s.name}</span>
                <span className="muted" style={{ fontSize: '0.85rem' }}>{s.kcal} kcal · {s.proteinG} g</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="row">
        <div className="field">
          <label>Calories (kcal)</label>
          <input
            type="number"
            min={0}
            value={draft.kcal}
            onChange={(e) => set('kcal', Number(e.target.value))}
          />
        </div>
        <div className="field">
          <label>Protein (g)</label>
          <input
            type="number"
            min={0}
            step={0.1}
            value={draft.proteinG}
            onChange={(e) => set('proteinG', Number(e.target.value))}
          />
        </div>
      </div>
      <div className="field">
        <label>Meal (optional)</label>
        <select value={draft.meal ?? ''} onChange={(e) => set('meal', (e.target.value || undefined) as MealTag | undefined)}>
          <option value="">— none —</option>
          {MEAL_TAGS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Date</label>
        <input type="date" value={draft.date} onChange={(e) => set('date', e.target.value)} />
      </div>
    </Modal>
  );
}
