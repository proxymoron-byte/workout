import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, useState } from 'react';
import { db, newId } from '../../lib/db';
import type { CycleStart } from '../../lib/types';
import { todayCET } from '../../lib/date';
import { phaseRanges, PHASE_LABEL, summarizeCycle } from '../../lib/cycle';
import { dedupeStarts, parseClueCsv } from '../../lib/clueImport';
import { Modal } from '../../components/Modal';

export function Cycle() {
  const all = useLiveQuery(() => db.cycleStarts.toArray(), []);
  const [editing, setEditing] = useState<CycleStart | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const sorted = useMemo(() => (all ?? []).slice().sort((a, b) => a.date.localeCompare(b.date)), [all]);
  const summary = useMemo(() => summarizeCycle(sorted), [sorted]);

  const onLog = () =>
    setEditing({
      id: newId(),
      date: todayCET(),
      createdAt: new Date().toISOString(),
    });

  const onSave = async (e: CycleStart) => {
    await db.cycleStarts.put(e);
    setEditing(null);
  };

  const onDelete = async (id: string) => {
    if (!confirm('Delete this period start?')) return;
    await db.cycleStarts.delete(id);
  };

  return (
    <>
      <div className="card section">
        {!summary.hasData ? (
          <div className="empty">Log your last period start date to begin tracking.</div>
        ) : (
          <div className="between">
            <div>
              <div className="muted" style={{ fontSize: '0.85rem' }}>Today</div>
              <div className="big-time" style={{ fontSize: '2.6rem' }}>
                Day {summary.currentDay}
              </div>
              <div>
                <span className={`pill phase-pill phase-${summary.currentPhase}`}>{PHASE_LABEL[summary.currentPhase!]}</span>
              </div>
              <div className="muted" style={{ fontSize: '0.85rem', marginTop: 'var(--space-3)' }}>
                Average length: {summary.averageLength} days · next predicted {summary.predictedNextStart}
              </div>
            </div>
            <div className="actions">
              <button className="btn btn-primary" onClick={onLog}>Log period start</button>
            </div>
          </div>
        )}
      </div>

      {summary.hasData && summary.currentDay !== null && (
        <div className="card section">
          <h2 style={{ marginBottom: 'var(--space-3)' }}>Phase strip</h2>
          <PhaseStrip averageLength={summary.averageLength} currentDay={summary.currentDay} />
        </div>
      )}

      <div className="card section" style={{ padding: 0 }}>
        <div className="between" style={{ padding: 'var(--space-4) var(--space-5)' }}>
          <h2 style={{ margin: 0 }}>Past starts</h2>
          <div className="actions">
            <button className="btn btn-sm" onClick={() => setImportOpen(true)}>Import from Clue</button>
            {!summary.hasData && (
              <button className="btn btn-sm btn-primary" onClick={onLog}>Log period start</button>
            )}
          </div>
        </div>
        {sorted.length === 0 && <div className="empty">No starts logged yet.</div>}
        {sorted
          .slice()
          .reverse()
          .map((s) => (
            <div key={s.id} className="list-row">
              <div>
                <div className="name">{s.date}</div>
              </div>
              <div className="actions">
                <button className="btn btn-sm" onClick={() => setEditing(s)}>Edit</button>
                <button className="btn btn-sm btn-danger" onClick={() => onDelete(s.id)}>Delete</button>
              </div>
            </div>
          ))}
      </div>

      {editing && <CycleModal entry={editing} onSave={onSave} onClose={() => setEditing(null)} />}
      {importOpen && (
        <ImportClueModal
          existingStarts={sorted.map((s) => s.date)}
          onImport={async (dates) => {
            await db.cycleStarts.bulkAdd(
              dates.map((d) => ({
                id: newId(),
                date: d,
                createdAt: new Date().toISOString(),
              })),
            );
            setImportOpen(false);
          }}
          onClose={() => setImportOpen(false)}
        />
      )}
    </>
  );
}

function PhaseStrip({ averageLength, currentDay }: { averageLength: number; currentDay: number }) {
  const ranges = phaseRanges(averageLength);
  const total = Math.max(currentDay, ranges[ranges.length - 1].to);
  return (
    <div className="phase-strip">
      {ranges.map((r) => {
        const widthPct = ((Math.min(r.to, total) - r.from + 1) / total) * 100;
        return (
          <div key={r.phase} className={`phase-strip-seg phase-${r.phase}`} style={{ width: `${widthPct}%` }}>
            <span>{PHASE_LABEL[r.phase]}</span>
          </div>
        );
      })}
      <div className="phase-strip-marker" style={{ left: `${((currentDay - 1) / total) * 100}%` }} title={`Day ${currentDay}`} />
    </div>
  );
}

function CycleModal({ entry, onSave, onClose }: { entry: CycleStart; onSave: (e: CycleStart) => void; onClose: () => void }) {
  const [draft, setDraft] = useState<CycleStart>(entry);
  return (
    <Modal
      open
      title="Log period start"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSave(draft)}>Save</button>
        </>
      }
    >
      <div className="field">
        <label>Date</label>
        <input
          type="date"
          value={draft.date}
          max={todayCET()}
          onChange={(e) => setDraft({ ...draft, date: e.target.value })}
          autoFocus
        />
      </div>
    </Modal>
  );
}

function ImportClueModal({
  existingStarts,
  onImport,
  onClose,
}: {
  existingStarts: string[];
  onImport: (dates: string[]) => Promise<void>;
  onClose: () => void;
}) {
  const [text, setText] = useState('');
  const [parsed, setParsed] = useState<ReturnType<typeof parseClueCsv> | null>(null);

  const onPickFile = async (file: File) => {
    setText(await file.text());
  };

  const onParse = () => setParsed(parseClueCsv(text));

  const dedup = parsed ? dedupeStarts(existingStarts, parsed.inferredStarts) : null;

  return (
    <Modal
      open
      title="Import from Clue"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={!dedup || dedup.added.length === 0}
            onClick={() => dedup && onImport(dedup.added)}
          >
            Import {dedup?.added.length ?? 0} start{dedup?.added.length === 1 ? '' : 's'}
          </button>
        </>
      }
    >
      <p className="muted" style={{ fontSize: '0.85rem', marginTop: 0 }}>
        Paste CSV exported from Clue, or upload the file. The parser tolerates ISO and DD/MM/YYYY dates and auto-detects a "period"
        column. Dates-only files work too — runs of consecutive period days are collapsed via the 14-day-gap rule.
      </p>
      <div className="row" style={{ marginBottom: 'var(--space-3)' }}>
        <input type="file" accept=".csv,text/csv,text/plain" onChange={(e) => e.target.files?.[0] && onPickFile(e.target.files[0])} />
      </div>
      <div className="field">
        <label>CSV</label>
        <textarea
          rows={6}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={'date,period\n2025-09-04,1\n2025-09-05,1\n2025-10-02,1'}
        />
      </div>
      <div className="row">
        <button className="btn" onClick={onParse} disabled={!text.trim()}>Parse</button>
      </div>
      {parsed && (
        <div className="card" style={{ marginTop: 'var(--space-4)' }}>
          <div className="muted" style={{ fontSize: '0.85rem', marginBottom: 'var(--space-2)' }}>
            Parsed {parsed.totalRowsParsed} rows · {parsed.inferredStarts.length} inferred period starts
            {dedup && ` · ${dedup.added.length} new, ${dedup.skipped.length} duplicates skipped`}
          </div>
          {parsed.warnings.length > 0 && (
            <ul className="muted" style={{ fontSize: '0.85rem', margin: '0 0 var(--space-2) 1.2em' }}>
              {parsed.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          )}
          {dedup && dedup.added.length > 0 && (
            <div style={{ fontSize: '0.85rem', maxHeight: 120, overflowY: 'auto' }}>{dedup.added.join(', ')}</div>
          )}
        </div>
      )}
    </Modal>
  );
}
