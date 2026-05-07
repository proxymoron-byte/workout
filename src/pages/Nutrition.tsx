import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { db, newId } from '../lib/db';
import type { MealTag, NutritionEntry } from '../lib/types';
import { addDaysCET, lastNDaysCET, todayCET } from '../lib/date';
import { useSettings } from '../lib/settings';
import { Modal } from '../components/Modal';
import { ArtDrop, ArtFlame } from '../components/Illustrations';
import { IconChevronLeft, IconChevronRight, IconClose, IconPlus, IconSearch } from '../components/Icons';

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
      const dow = new Date(`${d}T12:00:00Z`).toLocaleDateString(undefined, { weekday: 'short' });
      return {
        date: d,
        label: d === todayCET() ? 'Today' : dow,
        kcal: ents.reduce((s, e) => s + e.kcal, 0),
        protein: ents.reduce((s, e) => s + e.proteinG, 0),
        partial: d === todayCET(),
      };
    });
  }, [allEntries, date]);

  const today = todayCET();
  const isToday = date === today;
  const dateLabel = isToday
    ? 'Today, ' + new Date(`${today}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long' })
    : new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });

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
    await db.nutrition.delete(id);
  };

  const kcalGoal = settings.goals.kcalDaily;
  const proteinGoal = settings.goals.proteinDaily;
  const kcalPct = kcalGoal > 0 ? Math.round((totals.kcal / kcalGoal) * 100) : 0;
  const proteinPct = proteinGoal > 0 ? Math.round((totals.protein / proteinGoal) * 100) : 0;

  return (
    <div className="page page-nutrition">
      <section className="head-row">
        <div>
          <span className="page-eyebrow">Nutrition</span>
          <h1 className="page-title">{dateLabel}</h1>
          <p className="page-sub">
            <span className="greet-warm">{totals.kcal === 0 ? 'No entries yet today.' : "You're on track"}</span>
            {' '}— {kcalGoal > 0 && `${kcalPct}% of kcal goal`}
            {kcalGoal > 0 && proteinGoal > 0 && ', '}
            {proteinGoal > 0 && `${proteinPct}% of protein`}
          </p>
        </div>
        <div className="head-actions">
          <button className="ghost-btn" onClick={() => setDate(addDaysCET(date, -1))}>
            <IconChevronLeft size={14} stroke={1.7} /> Prev day
          </button>
          <button className="ghost-btn" onClick={() => setDate(addDaysCET(date, 1))} disabled={date >= today}>
            Next day <IconChevronRight size={14} stroke={1.7} />
          </button>
          <button className="cta-btn" onClick={onAdd}>
            <IconPlus size={14} stroke={2} /> Log food
          </button>
        </div>
      </section>

      <section className="nut-totals">
        <div className="total-card total-kcal">
          <div className="total-art" aria-hidden><ArtFlame size={130} /></div>
          <div className="total-head">
            <span className="total-label">Calories</span>
            <span className="total-pct">{kcalGoal > 0 ? `${kcalPct}%` : ''}</span>
          </div>
          <div className="total-num">
            <span className="total-big">{Math.round(totals.kcal).toLocaleString()}</span>
            {kcalGoal > 0 && <span className="total-of">/ {kcalGoal.toLocaleString()} kcal</span>}
          </div>
          <div className="total-bar">
            <div className="total-bar-fill" style={{ width: `${kcalGoal > 0 ? Math.min(100, (totals.kcal / kcalGoal) * 100) : 0}%` }} />
          </div>
          <div className="total-foot">
            {kcalGoal > 0 ? (
              <>
                <strong>{Math.max(0, kcalGoal - totals.kcal).toLocaleString()}</strong> kcal remaining for today
              </>
            ) : (
              <>Set a daily kcal goal in <Link to="/settings">Settings</Link></>
            )}
          </div>
        </div>

        <div className="total-card total-protein">
          <div className="total-art" aria-hidden><ArtDrop size={120} /></div>
          <div className="total-head">
            <span className="total-label">Protein</span>
            <span className="total-pct">{proteinGoal > 0 ? `${proteinPct}%` : ''}</span>
          </div>
          <div className="total-num">
            <span className="total-big">{Math.round(totals.protein)}</span>
            {proteinGoal > 0 && <span className="total-of">/ {proteinGoal} g</span>}
          </div>
          <div className="total-bar">
            <div className="total-bar-fill" style={{ width: `${proteinGoal > 0 ? Math.min(100, (totals.protein / proteinGoal) * 100) : 0}%` }} />
          </div>
          <div className="total-foot">
            {proteinGoal > 0 ? (
              <>
                <strong>{Math.max(0, proteinGoal - totals.protein)}g</strong> to go
              </>
            ) : (
              <>Set a daily protein goal in <Link to="/settings">Settings</Link></>
            )}
          </div>
        </div>
      </section>

      <section className="entries-section">
        <div className="section-head">
          <h2 className="section-title">Entries</h2>
          <span className="section-count">{todayEntries.length} item{todayEntries.length === 1 ? '' : 's'}</span>
        </div>
        {todayEntries.length === 0 ? (
          <div className="card empty">No entries for this day.</div>
        ) : (
          <ul className="entries-list">
            {todayEntries.map((e) => (
              <li key={e.id} className="entry-row">
                <span className={`meal-tag tag-${e.meal ?? 'snack'}`}>{e.meal ?? '—'}</span>
                <button
                  type="button"
                  onClick={() => setEditing(e)}
                  style={{ background: 'none', border: 0, padding: 0, textAlign: 'left', font: 'inherit', color: 'inherit', cursor: 'pointer' }}
                >
                  <span className="entry-name">{e.name}</span>
                </button>
                <span className="entry-kcal"><strong>{e.kcal}</strong> kcal</span>
                <span className="entry-protein"><strong>{e.proteinG}</strong>g protein</span>
                <button className="entry-x" onClick={() => onDelete(e.id)} aria-label="Delete">
                  <IconClose size={14} stroke={1.6} />
                </button>
              </li>
            ))}
            <li>
              <button className="entry-add" onClick={onAdd}>
                <span className="entry-add-icon"><IconPlus size={16} stroke={1.8} /></span>
                <span>Add another item</span>
              </button>
            </li>
          </ul>
        )}
      </section>

      <section className="week-strip">
        <div className="section-head">
          <h2 className="section-title">Last 7 days</h2>
          <div className="legend">
            <span className="legend-item"><span className="legend-swatch" style={{ background: 'var(--kcal)' }} /> kcal</span>
            <span className="legend-item"><span className="legend-swatch" style={{ background: 'var(--protein)' }} /> protein</span>
            <span className="legend-item"><span className="legend-line" /> goal</span>
          </div>
        </div>
        <div className="week-grid">
          {week.map((d) => {
            const kPct = kcalGoal > 0 ? (d.kcal / kcalGoal) * 100 : 0;
            const pPct = proteinGoal > 0 ? (d.protein / proteinGoal) * 100 : 0;
            return (
              <div key={d.date} className={`week-col${d.partial ? ' today' : ''}`}>
                <div className="week-bars">
                  <div className="week-track">
                    <div className="week-fill week-kcal" style={{ height: `${Math.min(kPct, 110)}%` }} />
                    {kcalGoal > 0 && <div className="week-goal-line" />}
                  </div>
                  <div className="week-track">
                    <div className="week-fill week-protein" style={{ height: `${Math.min(pPct, 110)}%` }} />
                    {proteinGoal > 0 && <div className="week-goal-line" />}
                  </div>
                </div>
                <div className="week-day">{d.label}</div>
                <div className="week-num">{Math.round(d.kcal).toLocaleString()}<span> · {Math.round(d.protein)}g</span></div>
              </div>
            );
          })}
        </div>
      </section>

      {editing && (
        <NutritionModal
          entry={editing}
          allEntries={allEntries ?? []}
          totalsBefore={totals}
          kcalGoal={kcalGoal}
          proteinGoal={proteinGoal}
          onSave={onSave}
          onClose={() => setEditing(null)}
        />
      )}
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
  totalsBefore,
  kcalGoal,
  proteinGoal,
  onSave,
  onClose,
}: {
  entry: NutritionEntry;
  allEntries: NutritionEntry[];
  totalsBefore: { kcal: number; protein: number };
  kcalGoal: number;
  proteinGoal: number;
  onSave: (e: NutritionEntry) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<NutritionEntry>(entry);
  const set = <K extends keyof NutritionEntry>(k: K, v: NutritionEntry[K]) => setDraft({ ...draft, [k]: v });

  const allSuggestions = useMemo(() => buildSuggestions(allEntries), [allEntries]);
  const filtered = useMemo(() => {
    const q = draft.name.trim().toLowerCase();
    if (!q) return [];
    return allSuggestions.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 4);
  }, [draft.name, allSuggestions]);

  const recent = allSuggestions.slice(0, 5);

  const pick = (s: SuggestedFood) => {
    setDraft({ ...draft, name: s.name, kcal: s.kcal, proteinG: s.proteinG });
  };

  const showPreview = draft.kcal > 0 || draft.proteinG > 0;

  return (
    <Modal open onClose={onClose} title="">
      <div className="modal-head" style={{ padding: 0, marginBottom: 8 }}>
        <div>
          <span className="modal-eyebrow">Quick log</span>
          <h2 className="modal-title">What did you eat?</h2>
        </div>
      </div>

      <label className="field field-search" style={{ marginBottom: 0 }}>
        <span className="field-label">Food</span>
        <div className="field-input-wrap" style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-card)', border: '1px solid var(--hairline-2)', borderRadius: 'var(--r-md)', padding: '10px 14px' }}>
          <IconSearch size={14} stroke={1.6} />
          <input
            autoFocus
            placeholder="Type or pick from recents"
            value={draft.name}
            onChange={(e) => set('name', e.target.value)}
            style={{ flex: 1, border: 0, background: 'transparent', outline: 'none', font: 'inherit', color: 'var(--ink)' }}
          />
        </div>
        {draft.name.trim() && filtered.length > 0 && (
          <div className="autocomplete">
            {filtered.map((s) => (
              <button key={s.name} type="button" className="ac-row" onMouseDown={(e) => e.preventDefault()} onClick={() => pick(s)}>
                <span className="ac-name">{s.name}</span>
                <span className="ac-meta">{s.kcal} kcal · {s.proteinG}g</span>
              </button>
            ))}
          </div>
        )}
      </label>

      {!draft.name.trim() && recent.length > 0 && (
        <div>
          <span className="muted" style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>Recent</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {recent.map((s) => (
              <button
                key={s.name}
                type="button"
                onClick={() => pick(s)}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--hairline)',
                  borderRadius: 'var(--r-md)',
                  padding: '8px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 500 }}>{s.name}</span>
                <span className="ac-meta">{s.kcal} · {s.proteinG}g</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="field">
          <span className="field-label">Calories</span>
          <input
            type="number"
            min={0}
            value={draft.kcal}
            onChange={(e) => set('kcal', Number(e.target.value))}
            placeholder="0"
          />
        </div>
        <div className="field">
          <span className="field-label">Protein</span>
          <input
            type="number"
            min={0}
            step={0.1}
            value={draft.proteinG}
            onChange={(e) => set('proteinG', Number(e.target.value))}
            placeholder="0"
          />
        </div>
      </div>

      <div className="field">
        <span className="field-label">Meal</span>
        <div className="seg">
          {MEAL_TAGS.map((m) => (
            <button
              key={m}
              type="button"
              className={`seg-btn${draft.meal === m ? ' seg-on' : ''}`}
              onClick={() => set('meal', m)}
              style={{ textTransform: 'capitalize' }}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {showPreview && (kcalGoal > 0 || proteinGoal > 0) && (
        <div style={{ background: 'var(--bg-sunken)', borderRadius: 'var(--r-md)', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span className="muted" style={{ fontSize: 12 }}>After this entry</span>
          {kcalGoal > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
              <span>kcal</span>
              <span>{(totalsBefore.kcal + draft.kcal).toLocaleString()} / {kcalGoal.toLocaleString()}</span>
            </div>
          )}
          {proteinGoal > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
              <span>protein</span>
              <span>{Math.round(totalsBefore.protein + draft.proteinG)} / {proteinGoal}g</span>
            </div>
          )}
        </div>
      )}

      <div className="modal-footer" style={{ marginTop: 12 }}>
        <button className="ghost-btn" onClick={onClose}>Cancel</button>
        <button
          className="cta-btn"
          disabled={!draft.name.trim()}
          onClick={() => onSave({ ...draft, name: draft.name.trim() })}
        >
          Save entry
        </button>
      </div>
    </Modal>
  );
}
