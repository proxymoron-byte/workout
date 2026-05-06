import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../../lib/db';
import {
  alternativesFor,
  generateRoutine,
  swapExercise,
  type GenerateInput,
  type GeneratorEquipment,
  type GeneratorGoal,
  type GeneratorDuration,
} from '../../lib/generator';
import type { Routine } from '../../lib/types';

const DEFAULT_INPUT: GenerateInput = {
  goal: 'full-body',
  durationMin: 30,
  equipment: 'bands',
};

export function Generate() {
  const navigate = useNavigate();
  const exercises = useLiveQuery(() => db.exercises.toArray(), []);
  const [input, setInput] = useState<GenerateInput>(DEFAULT_INPUT);
  const [draft, setDraft] = useState<Routine | null>(null);
  const [name, setName] = useState('');

  const onGenerate = () => {
    if (!exercises) return;
    const r = generateRoutine(exercises, input);
    setDraft(r);
    setName(r.name);
  };

  const onSave = async () => {
    if (!draft) return;
    const finalName = name.trim() || draft.name;
    const toSave: Routine = { ...draft, name: finalName };
    await db.routines.add(toSave);
    navigate(`/workouts/routines/${toSave.id}`);
  };

  const onSwap = (idx: number, newId: string) => {
    if (!draft || !exercises) return;
    setDraft(swapExercise(draft, idx, newId, exercises));
  };

  const exMap = new Map((exercises ?? []).map((e) => [e.id, e]));
  const usedIds = draft ? draft.exercises.map((e) => e.exerciseId) : [];

  return (
    <>
      <div className="section">
        <Link to="/workouts" className="muted" style={{ textDecoration: 'none' }}>
          ← Routines
        </Link>
      </div>

      <div className="card section">
        <h2 style={{ marginBottom: 'var(--space-3)' }}>Generate routine</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Picks exercises from your library by muscle group, balances them round-robin, and fits the target duration based on each
          exercise's defaults. Rule-based, not AI.
        </p>
        <div className="row">
          <div className="field">
            <label>Goal</label>
            <select value={input.goal} onChange={(e) => setInput({ ...input, goal: e.target.value as GeneratorGoal })}>
              <option value="full-body">Full body</option>
              <option value="upper">Upper</option>
              <option value="lower">Lower</option>
              <option value="core">Core focus</option>
            </select>
          </div>
          <div className="field">
            <label>Duration</label>
            <select
              value={input.durationMin}
              onChange={(e) => setInput({ ...input, durationMin: Number(e.target.value) as GeneratorDuration })}
            >
              <option value={20}>20 min</option>
              <option value={30}>30 min</option>
              <option value={45}>45 min</option>
            </select>
          </div>
          <div className="field">
            <label>Equipment</label>
            <select
              value={input.equipment}
              onChange={(e) => setInput({ ...input, equipment: e.target.value as GeneratorEquipment })}
            >
              <option value="bands">Bands only</option>
              <option value="bands+rowing">Bands + rowing</option>
              <option value="bodyweight+bands">Bodyweight + bands</option>
            </select>
          </div>
        </div>
        <button className="btn btn-primary" onClick={onGenerate} disabled={!exercises || exercises.length === 0}>
          {draft ? 'Regenerate' : 'Generate'}
        </button>
      </div>

      {draft && (
        <>
          <div className="card section">
            <div className="field">
              <label>Routine name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder={draft.name} />
            </div>
            <div className="muted" style={{ fontSize: '0.85rem' }}>
              {draft.kind === 'rowing-intervals' && draft.rowingBlock && (
                <>
                  Rowing: {draft.rowingBlock.warmupMin} min warm-up · {draft.rowingBlock.intervals}×{draft.rowingBlock.hardMin}/
                  {draft.rowingBlock.easyMin} min · {draft.rowingBlock.cooldownMin} min cooldown ·{' '}
                </>
              )}
              ~{draft.estimatedMinutes} min total · {draft.exercises.length} exercise
              {draft.exercises.length === 1 ? '' : 's'}
            </div>
          </div>

          <div className="card section" style={{ padding: 0 }}>
            {draft.exercises.length === 0 && <div className="empty">No exercises matched. Try a different goal or equipment.</div>}
            {draft.exercises.map((re, idx) => {
              const current = exMap.get(re.exerciseId);
              const alts = alternativesFor(exercises ?? [], re.exerciseId, usedIds);
              return (
                <div key={`${re.exerciseId}-${idx}`} className="list-row">
                  <div>
                    <div className="name">{current?.name ?? '(deleted)'}</div>
                    <div className="meta muted">
                      <span className="pill">{current?.muscleGroup ?? '?'}</span> · {re.sets} × {re.reps} · rest {re.restSec}s
                    </div>
                  </div>
                  <div className="actions">
                    {alts.length > 0 ? (
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value) onSwap(idx, e.target.value);
                        }}
                      >
                        <option value="">Swap…</option>
                        {alts.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="muted" style={{ fontSize: '0.85rem' }}>no swap</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="row" style={{ marginTop: 'var(--space-4)' }}>
            <button className="btn btn-primary" onClick={onSave} disabled={draft.exercises.length === 0}>
              Save routine
            </button>
            <button className="btn" onClick={onGenerate}>
              Regenerate
            </button>
          </div>
        </>
      )}
    </>
  );
}
