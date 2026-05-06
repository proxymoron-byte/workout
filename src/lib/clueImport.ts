import type { DateString } from './date';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export interface ClueParseResult {
  starts: DateString[];
  warnings: string[];
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function looksLikePeriodFlag(value: string): boolean {
  const v = value.trim().toLowerCase();
  return v === 'heavy' || v === 'medium' || v === 'light' || v === 'spotting' || v === 'period';
}

export function parseClueCsv(text: string): ClueParseResult {
  const warnings: string[] = [];
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { starts: [], warnings: ['File is empty.'] };

  const headerCols = splitCsvLine(lines[0]).map((s) => s.toLowerCase());
  const dateIdx = headerCols.findIndex((c) => c === 'date' || c === 'day');
  const periodIdx = headerCols.findIndex((c) => c.includes('period') || c.includes('menstruation') || c.includes('flow'));

  const dateRows: { date: DateString; isPeriod: boolean }[] = [];

  if (dateIdx === -1) {
    warnings.push('No "date" column found; treating each line as a date.');
    for (const line of lines) {
      const cell = splitCsvLine(line)[0];
      if (ISO_DATE.test(cell)) dateRows.push({ date: cell, isPeriod: true });
    }
  } else {
    for (let i = 1; i < lines.length; i++) {
      const cols = splitCsvLine(lines[i]);
      const cell = cols[dateIdx];
      if (!ISO_DATE.test(cell)) continue;
      const periodCell = periodIdx === -1 ? '' : (cols[periodIdx] ?? '');
      const isPeriod = periodIdx === -1 ? true : looksLikePeriodFlag(periodCell) || periodCell === '1' || periodCell.toLowerCase() === 'true';
      if (isPeriod) dateRows.push({ date: cell, isPeriod: true });
    }
  }

  const sorted = dateRows.map((r) => r.date).sort();
  const starts: DateString[] = [];
  let prev: string | null = null;
  for (const d of sorted) {
    if (prev === null) {
      starts.push(d);
    } else {
      const gap = (Date.parse(`${d}T00:00:00Z`) - Date.parse(`${prev}T00:00:00Z`)) / 86_400_000;
      if (gap >= 14) starts.push(d);
    }
    prev = d;
  }

  if (starts.length === 0 && dateRows.length === 0) {
    warnings.push('No period rows found. Make sure the CSV has a date column and a period/flow column.');
  }
  return { starts: Array.from(new Set(starts)), warnings };
}
