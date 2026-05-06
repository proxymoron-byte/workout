import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { db } from '../../lib/db';
import type { Exercise, Routine, RoutineExercise, RoutineKind } from '../../lib/types';
import { Modal } from '../../components/Modal';

export function RoutineDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const routine = useLiveQuery(() => (id ? db.routines.get(id) : undefined), [id]);
  const exercises = useLiveQuery(() => db.exercises.toArray(), []);

  const [draft, setDraft] = useState<Routine | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (routine) setDraft(routine);
  }, [routine]);

  if (!id) return <p>Missing routine id.</p>;
  if (routine === undefined) return <div className="empty">Loading…</div>;
  if (!routine) {
    return (
      <div className="card empty">
        Routine not found. <Link to="/workouts">Back to routines.</Link>
      </div>
    );
  }
  if (!draft) return null;

  const set = <K extends keyof Routine>(k: K, v: Routine[K]) => setDraft({ ...draft, [k]: v });
  const setExerciseAt = (i: number, patch: Partial<RoutineExercise>) => {
    const next = [...draft.exercises];
    next[i] = { ...next[i], ...patch };
    setDraft({ ...draft, exercises: next });
  };
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= draft.exercises.length) return;
    const next = [...draft.exercises];
    [next[i], next[j]] = [next[j], next[i]];
    setDraft({ ...draft, exercises: next });
  };
  const removeAt = (i: number) => {
    const next = draft.exercises.filter((_, idx) => idx !== i);
    setDraft({ ...draft, exercises: next });
  };
  const addExercise = (ex: Exercise) => {
    const re: RoutineExercise = {
      exerciseId: ex.id,
      sets: ex.defaultSets,
      reps: ex.defaultReps,
      restSec: ex.defaultRestSec || draft.defaultRestSec,
    };
    setDraft({ ...draft, exercises: [...draft.exercises, re] });
    setPickerOpen(false);
  };

  const dirty = JSON.stringify(draft) !== JSON.stringify(routine);

  const onSave = async () => {
    await db.routines.put(draft);
  };
  const onDelete = async () => {
    if (!confirm(`Delete "${routine.name}"?`)) return;
    await db.routines.delete(routine.id);
    navigate('/workouts');
  };

  const exMap = new Map((exercises ?? []).map((e) => [e.id, e]));

  return (
    <>
      <div className="section">
        <Link to="/workouts" className="muted" style={{ textDecoration: 'none' }}>
          ← Routines
        </Link>
      </div>

      <div className="card section">
        <div className="row">
          <div className="field">
            <label>Routine name</label>
            <input value={draft.name} onChange={(e) => set('name', e.target.value)} />
          </div>
          <div className="field">
            <label>Kind</label>
            <select value={draft.kind} onChange={(e) => set('kind', e.target.value as RoutineKind)}>
              <option value="standard">Standard</option>
              <option value="rowing-intervals">Rowing intervals + standard</option>
              <option value="active-recovery">Active recovery</option>
            </select>
          </div>
          <div className="field">
            <label>Estimated minutes</label>
            <input
              type="number"
              min={0}
              value={draft.estimatedMinutes}
              onChange={(e) => set('estimatedMinutes', Number(e.target.value))}
            />
          </div>
          <div className="field">
            <label>Default rest (sec)</label>
            <input
              type="number"
              min={0}
              value={draft.defaultRestSec}
              onChange={(e) => set('defaultRestSec', Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      {draft.kind === 'rowing-intervals' && (
        <div className="card section">
          <h2>Rowing block</h2>
          <p className="muted">Plays before the standard exercises.</p>
          <div className="row">
            <div className="field">
              <label>Warm-up (min)</label>
              <input
                type="number"
                min={0}
                value={draft.rowingBlock?.warmupMin ?? 3}
                onChange={(e) =>
                  set('rowingBlock', { ...(draft.rowingBlock ?? { warmupMin: 3, intervals: 8, hardMin: 1, easyMin: 1, cooldownMin: 2 }), warmupMin: Number(e.target.value) })
                }
              />
            </div>
            <div className="field">
              <label>Intervals</label>
              <input
                type="number"
                min={1}
                value={draft.rowingBlock?.intervals ?? 8}
                onChange={(e) =>
                  set('rowingBlock', { ...(draft.rowingBlock ?? { warmupMin: 3, intervals: 8, hardMin: 1, easyMin: 1, cooldownMin: 2 }), intervals: Number(e.target.value) })
                }
              />
            </div>
            <div className="field">
              <label>Hard (min)</label>
              <input
                type="number"
                min={0}
                step={0.5}
                value={draft.rowingBlock?.hardMin ?? 1}
                onChange={(e) =>
                  set('rowingBlock', { ...(draft.rowingBlock ?? { warmupMin: 3, intervals: 8, hardMin: 1, easyMin: 1, cooldownMin: 2 }), hardMin: Number(e.target.value) })
                }
              />
            </div>
            <div className="field">
              <label>Easy (min)</label>
              <input
                type="number"
                min={0}
                step={0.5}
                value={draft.rowingBlock?.easyMin ?? 1}
                onChange={(e) =>
                  set('rowingBlock', { ...(draft.rowingBlock ?? { warmupMin: 3, intervals: 8, hardMin: 1, easyMin: 1, cooldownMin: 2 }), easyMin: Number(e.target.value) })
                }
              />
            </div>
            <div className="field">
              <label>Cooldown (min)</label>
              <input
                type="number"
                min={0}
                value={draft.rowingBlock?.cooldownMin ?? 2}
                onChange={(e) =>
                  set('rowingBlock', { ...(draft.rowingBlock ?? { warmupMin: 3, intervals: 8, hardMin: 1, easyMin: 1, cooldownMin: 2 }), cooldownMin: Number(e.target.value) })
                }
              />
            </div>
          </div>
        </div>
      )}

      {draft.kind === 'active-recovery' && (
        <div className="card section">
          <h2>Active recovery</h2>
          <div className="field">
            <label>Default activity</label>
            <input
              value={draft.defaultActivity ?? ''}
              onChange={(e) => set('defaultActivity', e.target.value || undefined)}
              placeholder="walking, skating, mobility…"
            />
          </div>
        </div>
      )}

      {draft.kind !== 'active-recovery' && (
        <div className="card section" style={{ padding: 0 }}>
          <div className="between" style={{ padding: 'var(--space-4) var(--space-5)' }}>
            <h2 style={{ margin: 0 }}>Exercises</h2>
            <button className="btn btn-primary btn-sm" onClick={() => setPickerOpen(true)}>
              + Add exercise
            </button>
          </div>
          {draft.exercises.length === 0 && <div className="empty">No exercises yet.</div>}
          {draft.exercises.map((re, i) => {
            const ex = exMap.get(re.exerciseId);
            return (
              <div key={`${re.exerciseId}-${i}`} className="list-row">
                <div>
                  <div className="name">{ex?.name ?? '(deleted exercise)'}</div>
                  <div className="meta muted">
                    <span className="pill">{ex?.muscleGroup ?? '?'}</span>
                  </div>
                  <div className="row" style={{ marginTop: 'var(--space-2)' }}>
                    <div className="field" style={{ marginBottom: 0 }}>
                      <label>Sets</label>
                      <input
                        type="number"
                        min={1}
                        value={re.sets}
                        onChange={(e) => setExerciseAt(i, { sets: Number(e.target.value) })}
                      />
                    </div>
                    <div className="field" style={{ marginBottom: 0 }}>
                      <label>Reps</label>
                      <input value={re.reps} onChange={(e) => setExerciseAt(i, { reps: e.target.value })} />
                    </div>
                    <div className="field" style={{ marginBottom: 0 }}>
                      <label>Rest (sec)</label>
                      <input
                        type="number"
                        min={0}
                        value={re.restSec}
                        onChange={(e) => setExerciseAt(i, { restSec: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>
                <div className="actions">
                  <button className="btn btn-icon" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">
                    ↑
                  </button>
                  <button
                    className="btn btn-icon"
                    onClick={() => move(i, 1)}
                    disabled={i === draft.exercises.length - 1}
                    aria-label="Move down"
                  >
                    ↓
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => removeAt(i)}>
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="row" style={{ marginTop: 'var(--space-4)' }}>
        <button className="btn btn-primary" disabled={!dirty} onClick={onSave}>
          {dirty ? 'Save changes' : 'Saved'}
        </button>
        <button className="btn" disabled>
          Start session (step 3)
        </button>
        <button className="btn btn-danger" onClick={onDelete} style={{ marginLeft: 'auto' }}>
          Delete routine
        </button>
      </div>

      {pickerOpen && (
        <ExercisePicker
          exercises={exercises ?? []}
          alreadyAdded={new Set(draft.exercises.map((e) => e.exerciseId))}
          onPick={addExercise}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </>
  );
}

function ExercisePicker({
  exercises,
  alreadyAdded,
  onPick,
  onClose,
}: {
  exercises: Exercise[];
  alreadyAdded: Set<string>;
  onPick: (ex: Exercise) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState('');
  const filtered = exercises
    .filter((e) => e.name.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Modal open title="Add exercise from library" onClose={onClose}>
      <div className="field">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search exercises…" autoFocus />
      </div>
      <div className="stack" style={{ maxHeight: '50vh', overflowY: 'auto' }}>
        {filtered.length === 0 && <div className="empty">No matches.</div>}
        {filtered.map((ex) => (
          <button
            key={ex.id}
            className="btn"
            style={{ justifyContent: 'space-between', textAlign: 'left' }}
            onClick={() => onPick(ex)}
          >
            <span>
              {ex.name} {alreadyAdded.has(ex.id) && <span className="muted">(already added)</span>}
            </span>
            <span className="pill">{ex.muscleGroup}</span>
          </button>
        ))}
      </div>
    </Modal>
  );
}
