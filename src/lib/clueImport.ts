import { daysBetweenCET, type DateString } from './date';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

interface ParsedRow {
  date: DateString;
  isPeriod: boolean;
}

function normalizeDate(raw: string): DateString | null {
  const s = raw.trim();
  if (!s) return null;
  if (ISO_DATE.test(s)) return s;
  // Try a few common formats: dd/mm/yyyy, mm/dd/yyyy, yyyy/mm/dd
  const slash = s.match(/^(\d{1,4})[\/\.\-](\d{1,2})[\/\.\-](\d{1,4})$/);
  if (slash) {
    const [, a, b, c] = slash;
    const aN = Number(a);
    const cN = Number(c);
    if (a.length === 4) {
      // yyyy-mm-dd
      return `${a.padStart(4, '0')}-${b.padStart(2, '0')}-${c.padStart(2, '0')}`;
    }
    if (c.length === 4) {
      // dd/mm/yyyy or mm/dd/yyyy — assume European dd/mm because user is CET
      const day = aN > 12 ? aN : aN; // can't fully disambiguate; go with dd/mm/yyyy
      const mon = Number(b);
      const yr = cN;
      return `${String(yr).padStart(4, '0')}-${String(mon).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }
  return null;
}

function parseBoolish(raw: string): boolean | null {
  const v = raw.trim().toLowerCase();
  if (!v) return null;
  if (['1', 'true', 'yes', 'y', 'period', 'menstruation', 'flow'].includes(v)) return true;
  if (['0', 'false', 'no', 'n', '-', 'none'].includes(v)) return false;
  // Clue often uses values like "light", "medium", "heavy", "spotting"
  if (['light', 'medium', 'heavy', 'spotting'].includes(v)) return true;
  return null;
}

export interface ClueParseResult {
  inferredStarts: DateString[];
  totalRowsParsed: number;
  warnings: string[];
}

export function parseClueCsv(text: string): ClueParseResult {
  const warnings: string[] = [];
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'));
  if (lines.length === 0) {
    return { inferredStarts: [], totalRowsParsed: 0, warnings: ['Empty file.'] };
  }

  // Detect header
  const firstCells = lines[0].split(',').map((c) => c.trim().toLowerCase());
  const hasHeader =
    firstCells.some((c) => c === 'date' || c === 'day') ||
    firstCells.some((c) => c.includes('period') || c.includes('menstruation') || c.includes('flow'));
  let dateIdx = 0;
  let periodIdx = 1;
  if (hasHeader) {
    const idx = firstCells.findIndex((c) => c === 'date' || c === 'day');
    if (idx >= 0) dateIdx = idx;
    const pIdx = firstCells.findIndex((c) => c.includes('period') || c.includes('menstruation') || c.includes('flow'));
    if (pIdx >= 0) periodIdx = pIdx;
  }
  const dataLines = hasHeader ? lines.slice(1) : lines;

  const rows: ParsedRow[] = [];
  for (const line of dataLines) {
    const cells = line.split(',').map((c) => c.trim());
    const dateRaw = cells[dateIdx] ?? '';
    const date = normalizeDate(dateRaw);
    if (!date) continue;
    const periodRaw = cells[periodIdx] ?? '';
    const isPeriod = parseBoolish(periodRaw) ?? (periodRaw === '' ? false : true);
    rows.push({ date, isPeriod });
  }

  if (rows.length === 0) {
    return { inferredStarts: [], totalRowsParsed: 0, warnings: ['No date rows found. Expected `date` column with ISO or DD/MM/YYYY dates.'] };
  }

  // Sort ascending
  rows.sort((a, b) => a.date.localeCompare(b.date));

  // Two paths:
  // 1) The CSV explicitly marks period vs not — collect period days, then infer "starts" as days where the previous period day was ≥14 days earlier (or there was no previous one).
  // 2) The CSV is dates-only — treat each row as a period start directly, then collapse runs by ≥14-day gap.
  const periodDays = rows.filter((r) => r.isPeriod).map((r) => r.date);
  const candidates = periodDays.length > 0 ? periodDays : rows.map((r) => r.date);
  if (periodDays.length === 0) {
    warnings.push('No period column detected. Treating each dated row as a period entry.');
  }

  const starts: DateString[] = [];
  let lastPeriodDay: DateString | null = null;
  for (const d of candidates) {
    if (!lastPeriodDay || daysBetweenCET(lastPeriodDay, d) >= 14) {
      starts.push(d);
    }
    lastPeriodDay = d;
  }

  return { inferredStarts: starts, totalRowsParsed: rows.length, warnings };
}

export function dedupeStarts(existing: DateString[], incoming: DateString[]): { added: DateString[]; skipped: DateString[] } {
  const set = new Set(existing);
  const added: DateString[] = [];
  const skipped: DateString[] = [];
  for (const d of incoming) {
    if (set.has(d)) skipped.push(d);
    else {
      added.push(d);
      set.add(d);
    }
  }
  return { added, skipped };
}
