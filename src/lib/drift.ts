import { db } from './db';
import { addDaysCET, daysBetweenCET, lastNDaysCET, startOfWeekCET, todayCET, type DateString } from './date';
import { isOverdueByAtLeast, viewFor } from './checkups';
import { loadSettings } from './settings';
import type { DriftRuleId, Settings } from './types';

export interface DriftSignal {
  ruleId: DriftRuleId;
  message: string;
  actionLabel: string;
  actionPath: string;
  priority: number;
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export async function dismissRule(ruleId: DriftRuleId): Promise<void> {
  const dismissedUntil = new Date(Date.now() + ONE_DAY_MS).toISOString();
  await db.driftDismissals.put({ ruleId, dismissedUntil });
}

async function isDismissed(ruleId: DriftRuleId): Promise<boolean> {
  const d = await db.driftDismissals.get(ruleId);
  if (!d) return false;
  return d.dismissedUntil > new Date().toISOString();
}

async function ruleEnabled(settings: Settings, id: DriftRuleId): Promise<boolean> {
  if (!settings.driftRules[id]) return false;
  if (await isDismissed(id)) return false;
  return true;
}

interface SignalContext {
  settings: Settings;
  today: DateString;
}

type RuleEvaluator = (ctx: SignalContext) => Promise<DriftSignal | null>;

const overdueCheckup: RuleEvaluator = async ({ today }) => {
  const checkups = await db.checkups.toArray();
  const overdueViews = checkups
    .map((c) => viewFor(c, today))
    .filter((v) => isOverdueByAtLeast(v, 30));
  if (overdueViews.length === 0) return null;
  const worst = overdueViews.sort((a, b) => (a.daysToDue ?? 0) - (b.daysToDue ?? 0))[0];
  const last = worst.checkup.lastCompletedDate ?? 'never';
  return {
    ruleId: 'overdueCheckup',
    message: `${worst.checkup.name} is overdue — last completed ${last}.`,
    actionLabel: 'Open checkups',
    actionPath: '/checkups',
    priority: 1,
  };
};

const missedWorkouts: RuleEvaluator = async ({ settings, today }) => {
  if (settings.goals.weeklyWorkouts < 3) return null;
  const last7 = lastNDaysCET(7, today);
  const allSessions = await db.sessions.toArray();
  const completed7 = allSessions.filter((s) => s.completedAt && last7.includes(s.startedAt.slice(0, 10)));
  if (completed7.length >= 2) return null;

  const weekStart = startOfWeekCET(today);
  const fourWeeksBack = addDaysCET(weekStart, -28);
  const trailing4w = allSessions.filter((s) => {
    if (!s.completedAt) return false;
    const d = s.startedAt.slice(0, 10);
    return d >= fourWeeksBack && d < weekStart;
  });
  const usual = trailing4w.length > 0 ? Math.round(trailing4w.length / 4) : settings.goals.weeklyWorkouts;
  return {
    ruleId: 'missedWorkouts',
    message: `Only ${completed7.length} workout${completed7.length === 1 ? '' : 's'} this week — your usual is ${usual}.`,
    actionLabel: "Start today's workout",
    actionPath: '/',
    priority: 2,
  };
};

const proteinLow: RuleEvaluator = async ({ settings, today }) => {
  const goal = settings.goals.proteinDaily;
  if (goal <= 0) return null;
  const last7 = lastNDaysCET(7, today);
  const entries = await db.nutrition.toArray();
  const dailyTotals = new Map<string, number>();
  for (const d of last7) dailyTotals.set(d, 0);
  for (const e of entries) {
    if (dailyTotals.has(e.date)) dailyTotals.set(e.date, (dailyTotals.get(e.date) ?? 0) + e.proteinG);
  }
  const daysWithEntries = Array.from(dailyTotals.values()).filter((v) => v > 0).length;
  if (daysWithEntries < 4) return null;
  const avg = Array.from(dailyTotals.values()).reduce((a, b) => a + b, 0) / 7;
  if (avg >= goal * 0.85) return null;
  return {
    ruleId: 'proteinLow',
    message: `Protein averaging ${Math.round(avg)} g/day vs ${goal} g target.`,
    actionLabel: 'Log nutrition',
    actionPath: '/nutrition',
    priority: 3,
  };
};

const kcalHigh: RuleEvaluator = async ({ settings, today }) => {
  const goal = settings.goals.kcalDaily;
  if (goal <= 0) return null;
  const last7 = lastNDaysCET(7, today);
  const entries = await db.nutrition.toArray();
  const dailyTotals = new Map<string, number>();
  for (const d of last7) dailyTotals.set(d, 0);
  for (const e of entries) {
    if (dailyTotals.has(e.date)) dailyTotals.set(e.date, (dailyTotals.get(e.date) ?? 0) + e.kcal);
  }
  const daysWithEntries = Array.from(dailyTotals.values()).filter((v) => v > 0).length;
  if (daysWithEntries < 4) return null;
  const avg = Array.from(dailyTotals.values()).reduce((a, b) => a + b, 0) / 7;
  if (avg <= goal * 1.15) return null;
  return {
    ruleId: 'kcalHigh',
    message: `Calories averaging ${Math.round(avg)}/day vs ${goal}.`,
    actionLabel: 'Open nutrition',
    actionPath: '/nutrition',
    priority: 4,
  };
};

const weightTrend: RuleEvaluator = async ({ settings, today }) => {
  const goalKg = settings.goals.weightGoalKg;
  if (goalKg === undefined) return null;
  const all = (await db.weights.toArray()).slice().sort((a, b) => a.date.localeCompare(b.date));
  if (all.length < 4) return null;
  const last14 = all.filter((e) => {
    const d = daysBetweenCET(e.date, today);
    return d >= 0 && d <= 14;
  });
  const earlier = all.filter((e) => {
    const d = daysBetweenCET(e.date, today);
    return d > 14 && d <= 28;
  });
  if (last14.length < 2 || earlier.length < 2) return null;
  const recentAvg = last14.reduce((s, e) => s + e.weightKg, 0) / last14.length;
  const earlierAvg = earlier.reduce((s, e) => s + e.weightKg, 0) / earlier.length;
  const goalDir = Math.sign(goalKg - earlierAvg);
  const actualDir = Math.sign(recentAvg - earlierAvg);
  const pctChange = Math.abs(recentAvg - earlierAvg) / earlierAvg;
  if (goalDir === 0 || actualDir === 0) return null;
  if (goalDir === actualDir) return null;
  if (pctChange < 0.015) return null;
  return {
    ruleId: 'weightTrend',
    message: 'Weight trend has shifted opposite to your goal — last 14 days.',
    actionLabel: 'Open body',
    actionPath: '/body',
    priority: 5,
  };
};

const longGap: RuleEvaluator = async ({ today }) => {
  const [n, w, s, st, c] = await Promise.all([
    db.nutrition.toArray(),
    db.weights.toArray(),
    db.sessions.toArray(),
    db.steps.toArray(),
    db.cycleStarts.toArray(),
  ]);
  const dates: string[] = [
    ...n.map((x) => x.date),
    ...w.map((x) => x.date),
    ...s.filter((x) => x.completedAt).map((x) => x.startedAt.slice(0, 10)),
    ...st.map((x) => x.date),
    ...c.map((x) => x.date),
  ];
  if (dates.length === 0) return null;
  const last = dates.sort().at(-1)!;
  const days = daysBetweenCET(last, today);
  if (days < 3) return null;
  return {
    ruleId: 'longGap',
    message: `Welcome back — last log was ${last}.`,
    actionLabel: 'Quick log',
    actionPath: '/nutrition',
    priority: 6,
  };
};

const exportReminder: RuleEvaluator = async ({ settings, today }) => {
  const [nCount, sCount, stCount] = await Promise.all([db.nutrition.count(), db.sessions.count(), db.steps.count()]);
  if (nCount === 0 && sCount === 0 && stCount === 0) return null;
  const last = settings.lastExportAt;
  const lastDate = last ? last.slice(0, 10) : null;
  const days = lastDate ? daysBetweenCET(lastDate, today) : 999;
  if (days < 30) return null;
  return {
    ruleId: 'exportReminder',
    message: lastDate ? `It's been ${days} days since your last export.` : `You haven't exported your data yet.`,
    actionLabel: 'Export now',
    actionPath: '/settings',
    priority: 7,
  };
};

const RULES: { id: DriftRuleId; evaluate: RuleEvaluator }[] = [
  { id: 'overdueCheckup', evaluate: overdueCheckup },
  { id: 'missedWorkouts', evaluate: missedWorkouts },
  { id: 'proteinLow', evaluate: proteinLow },
  { id: 'kcalHigh', evaluate: kcalHigh },
  { id: 'weightTrend', evaluate: weightTrend },
  { id: 'longGap', evaluate: longGap },
  { id: 'exportReminder', evaluate: exportReminder },
];

export async function evaluateDrift(today: DateString = todayCET()): Promise<DriftSignal | null> {
  const settings = loadSettings();
  const ctx: SignalContext = { settings, today };
  for (const rule of RULES) {
    if (!(await ruleEnabled(settings, rule.id))) continue;
    const signal = await rule.evaluate(ctx);
    if (signal) return signal;
  }
  return null;
}
