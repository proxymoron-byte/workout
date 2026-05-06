import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, useRef, useState } from 'react';
import { db, newId } from '../../lib/db';
import type { CycleStart } from '../../lib/types';
import { todayCET } from '../../lib/date';
import { PHASE_RANGES, summarizeCycle, type CyclePhase } from '../../lib/cycle';
import { parseClueCsv } from '../../lib/clueImport';
import { Modal } from '../../components/Modal';

const PHASE_LABEL: Record<CyclePhase, string> = {
  menstrual: 'Menstrual',
  follicular: 'Follicular',
  ovulatory: 'Ovulatory',
  luteal: 'Luteal',
};

export function Cycle() {
  const [editing, setEditing] = useState<CycleStart | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const all = useLiveQuery(() => db.cycleStarts.toArray(), []);

  const summary = useMemo(() => summarizeCycle(all ?? []), [all]);

  const onLog = () => {
    setEditing({
      id: newId(),
      date: todayCET(),
      createdAt: new Date().toISOString(),
    });
  };

  const onSave = async (s: CycleStart) => {
    await db.cycleStarts.put(s);
    setEditing(null);
  };

  const onDelete = async (id: string) => {
    if (!confirm('Delete this period start?')) return;
    await db.cycleStarts.delete(id);
  };

  if (!all || all.length === 0) {
    return (
      <>
        <div className="card empty section">
          Log your last period start date to begin tracking. The dashboard uses a default 28-day cycle until you log a second start.
          <div style={{ marginTop: 'var(--space-4)' }}>
            <button className="btn btn-primary" onClick={onLog}>Log period start</button>
            <button className="btn" style={{ marginLeft: 'var(--space-2)' }} onClick={() => setImportOpen(true)}>
              Import from Clue…
            </button>
          </div>
        </div>
        {editing && <CycleStartModal entry={editing} onSave={onSave} onClose={() => setEditing(null)} />}
        {importOpen && <ClueImportModal onClose={() => setImportOpen(false)} />}
      </>
    );
  }

  return (
    <>
      <div className="card section">
        <div className="between" style={{ marginBottom: 'var(--space-4)' }}>
          <div>
            <div className="muted" style={{ fontSize: '0.85rem' }}>Today</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 600 }}>
              {summary.todayDay !== null ? `Day ${summary.todayDay}` : '—'}
              {summary.todayPhase && (
                <span className={`pill phase-${summary.todayPhase}`} style={{ marginLeft: 'var(--space-3)' }}>
                  {PHASE_LABEL[summary.todayPhase]}
                </span>
              )}
            </div>
          </div>
          <button className="btn btn-primary" onClick={onLog}>Log period start</button>
        </div>
        <div className="row" style={{ gap: 'var(--space-6)' }}>
          <div>
            <div className="muted" style={{ fontSize: '0.85rem' }}>Average cycle length</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 500 }}>{summary.averageLength} days</div>
          </div>
          <div>
            <div className="muted" style={{ fontSize: '0.85rem' }}>Predicted next period</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 500 }}>{summary.predictedNext ?? '—'}</div>
          </div>
        </div>
      </div>

      <div className="card section">
        <h2 style={{ marginBottom: 'var(--space-4)' }}>Phase</h2>
        <PhaseStrip todayDay={summary.todayDay} cycleLength={summary.averageLength} />
      </div>

      <div className="card section" style={{ padding: 0 }}>
        <div className="between" style={{ padding: 'var(--space-4) var(--space-5)' }}>
          <h3 style={{ margin: 0 }}>Past starts</h3>
          <button className="btn btn-sm" onClick={() => setImportOpen(true)}>Import from Clue…</button>
        </div>
        {(all ?? [])
          .slice()
          .sort((a, b) => b.date.localeCompare(a.date))
          .map((c) => (
            <div key={c.id} className="list-row">
              <div>
                <div className="name">{c.date}</div>
              </div>
              <div className="actions">
                <button className="btn btn-sm" onClick={() => setEditing(c)}>Edit</button>
                <button className="btn btn-sm btn-danger" onClick={() => onDelete(c.id)}>Delete</button>
              </div>
            </div>
          ))}
      </div>

      {editing && <CycleStartModal entry={editing} onSave={onSave} onClose={() => setEditing(null)} />}
      {importOpen && <ClueImportModal onClose={() => setImportOpen(false)} />}
    </>
  );
}

function PhaseStrip({ todayDay, cycleLength }: { todayDay: number | null; cycleLength: number }) {
  const total = Math.max(28, cycleLength);
  const segments = PHASE_RANGES.map((r) => ({
    phase: r.phase,
    start: r.start,
    end: r.phase === 'luteal' ? total : r.end,
  }));
  const todayPct = todayDay !== null ? Math.min(100, ((todayDay - 0.5) / total) * 100) : null;

  return (
    <div>
      <div className="phase-strip">
        {segments.map((s) => {
          const widthPct = ((s.end - s.start + 1) / total) * 100;
          return (
            <div
              key={s.phase}
              className={`phase-segment phase-${s.phase}`}
              style={{ width: `${widthPct}%` }}
              title={`${PHASE_LABEL[s.phase]} (days ${s.start}-${s.end})`}
            >
              <span>{PHASE_LABEL[s.phase]}</span>
            </div>
          );
        })}
        {todayPct !== null && <div className="phase-marker" style={{ left: `${todayPct}%` }} />}
      </div>
      <div className="muted" style={{ fontSize: '0.8rem', marginTop: 'var(--space-2)' }}>
        Day 1 → {total} (cycle length {cycleLength})
      </div>
    </div>
  );
}

function CycleStartModal({
  entry,
  onSave,
  onClose,
}: {
  entry: CycleStart;
  onSave: (s: CycleStart) => void;
  onClose: () => void;
}) {
  const [date, setDate] = useState(entry.date);
  return (
    <Modal
      open
      title="Log period start"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSave({ ...entry, date })}>Save</button>
        </>
      }
    >
      <div className="field">
        <label>Start date</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} max={todayCET()} />
      </div>
    </Modal>
  );
}

function ClueImportModal({ onClose }: { onClose: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [paste, setPaste] = useState('');
  const [preview, setPreview] = useState<{ starts: string[]; warnings: string[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  const onPickFile = async (file: File) => {
    const text = await file.text();
    setPaste(text);
    setPreview(parseClueCsv(text));
  };

  const onParse = () => {
    setPreview(parseClueCsv(paste));
  };

  const onImport = async () => {
    if (!preview) return;
    setBusy(true);
    try {
      const existing = new Set((await db.cycleStarts.toArray()).map((c) => c.date));
      const fresh = preview.starts.filter((d) => !existing.has(d));
      await db.cycleStarts.bulkAdd(
        fresh.map((d) => ({ id: crypto.randomUUID(), date: d, createdAt: new Date().toISOString() })),
      );
      setDone(`Imported ${fresh.length} period start${fresh.length === 1 ? '' : 's'}.`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      title="Import from Clue"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Close</button>
          {!done && (
            <button className="btn btn-primary" disabled={!preview || preview.starts.length === 0 || busy} onClick={onImport}>
              {busy ? 'Importing…' : `Import ${preview?.starts.length ?? 0} start${preview?.starts.length === 1 ? '' : 's'}`}
            </button>
          )}
        </>
      }
    >
      <p className="muted" style={{ marginTop: 0 }}>
        Export your data from Clue (Profile → Data export → CSV), then upload or paste below. The parser looks for date + flow columns and infers period starts as ≥14-day gaps.
      </p>
      <div className="row">
        <button className="btn" onClick={() => fileRef.current?.click()}>Upload CSV…</button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onPickFile(f);
            e.target.value = '';
          }}
        />
      </div>
      <div className="field" style={{ marginTop: 'var(--space-4)' }}>
        <label>Or paste CSV</label>
        <textarea
          rows={6}
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
          placeholder="date,period&#10;2025-01-04,heavy&#10;…"
        />
      </div>
      <div className="row">
        <button className="btn btn-sm" onClick={onParse} disabled={!paste.trim()}>Parse</button>
      </div>
      {preview && (
        <div className="card" style={{ marginTop: 'var(--space-4)' }}>
          <div style={{ fontWeight: 500 }}>{preview.starts.length} period start{preview.starts.length === 1 ? '' : 's'} detected</div>
          {preview.starts.length > 0 && (
            <div className="muted" style={{ fontSize: '0.85rem', marginTop: 'var(--space-2)' }}>
              {preview.starts.slice(0, 12).join(', ')}{preview.starts.length > 12 ? ', …' : ''}
            </div>
          )}
          {preview.warnings.map((w, i) => (
            <div key={i} className="muted" style={{ fontSize: '0.85rem', color: 'var(--color-warn)', marginTop: 'var(--space-1)' }}>{w}</div>
          ))}
        </div>
      )}
      {done && (
        <div className="muted" style={{ marginTop: 'var(--space-3)', color: 'var(--color-info)' }}>{done}</div>
      )}
    </Modal>
  );
}
