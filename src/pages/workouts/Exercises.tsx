import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { db, newId } from '../../lib/db';
import type { Exercise, MuscleGroup } from '../../lib/types';
import { Modal } from '../../components/Modal';

const MUSCLE_GROUPS: MuscleGroup[] = ['legs', 'back', 'chest', 'shoulders', 'core', 'full body'];

const EMPTY: Exercise = {
  id: '',
  name: '',
  muscleGroup: 'full body',
  defaultSets: 3,
  defaultReps: '12',
  defaultRestSec: 45,
};

export function Exercises() {
  const exercises = useLiveQuery(() => db.exercises.orderBy('name').toArray(), []);
  const [editing, setEditing] = useState<Exercise | null>(null);

  const onAdd = () => setEditing({ ...EMPTY, id: newId() });
  const onSave = async (ex: Exercise) => {
    await db.exercises.put(ex);
    setEditing(null);
  };
  const onDelete = async (id: string) => {
    if (!confirm('Delete this exercise? Routines that reference it will show "(deleted)".')) return;
    await db.exercises.delete(id);
  };

  return (
    <>
      <div className="between" style={{ marginBottom: 'var(--space-4)' }}>
        <p className="muted" style={{ margin: 0 }}>
          {exercises?.length ?? 0} exercises in your library.
        </p>
        <button className="btn btn-primary" onClick={onAdd}>
          + New exercise
        </button>
      </div>
      <div className="card" style={{ padding: 0 }}>
        {!exercises && <div className="empty">Loading…</div>}
        {exercises && exercises.length === 0 && <div className="empty">No exercises yet.</div>}
        {exercises?.map((ex) => (
          <div key={ex.id} className="list-row">
            <div>
              <div className="name">{ex.name}</div>
              <div className="meta">
                <span className="pill">{ex.muscleGroup}</span> · {ex.defaultSets} × {ex.defaultReps} · rest {ex.defaultRestSec}s
                {ex.referenceUrl && (
                  <>
                    {' · '}
                    <a href={ex.referenceUrl} target="_blank" rel="noreferrer">
                      reference ↗
                    </a>
                  </>
                )}
              </div>
            </div>
            <div className="actions">
              <button className="btn btn-sm" onClick={() => setEditing(ex)}>
                Edit
              </button>
              <button className="btn btn-sm btn-danger" onClick={() => onDelete(ex.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      {editing && <ExerciseModal exercise={editing} onSave={onSave} onClose={() => setEditing(null)} />}
    </>
  );
}

function ExerciseModal({
  exercise,
  onSave,
  onClose,
}: {
  exercise: Exercise;
  onSave: (ex: Exercise) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<Exercise>(exercise);
  const set = <K extends keyof Exercise>(k: K, v: Exercise[K]) => setDraft({ ...draft, [k]: v });

  return (
    <Modal
      open
      title={exercise.name ? `Edit · ${exercise.name}` : 'New exercise'}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
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
      <div className="field">
        <label>Name</label>
        <input value={draft.name} onChange={(e) => set('name', e.target.value)} autoFocus />
      </div>
      <div className="field">
        <label>Muscle group</label>
        <select value={draft.muscleGroup} onChange={(e) => set('muscleGroup', e.target.value as MuscleGroup)}>
          {MUSCLE_GROUPS.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>
      <div className="row">
        <div className="field">
          <label>Default sets</label>
          <input
            type="number"
            min={1}
            value={draft.defaultSets}
            onChange={(e) => set('defaultSets', Number(e.target.value))}
          />
        </div>
        <div className="field">
          <label>Default reps</label>
          <input value={draft.defaultReps} onChange={(e) => set('defaultReps', e.target.value)} />
        </div>
        <div className="field">
          <label>Rest (seconds)</label>
          <input
            type="number"
            min={0}
            value={draft.defaultRestSec}
            onChange={(e) => set('defaultRestSec', Number(e.target.value))}
          />
        </div>
      </div>
      <div className="field">
        <label>Reference URL (optional)</label>
        <input
          value={draft.referenceUrl ?? ''}
          onChange={(e) => set('referenceUrl', e.target.value || undefined)}
          placeholder="https://www.fitbod.me/exercises/…"
        />
      </div>
      <div className="field">
        <label>Notes (optional)</label>
        <textarea
          value={draft.notes ?? ''}
          onChange={(e) => set('notes', e.target.value || undefined)}
          rows={2}
        />
      </div>
    </Modal>
  );
}
