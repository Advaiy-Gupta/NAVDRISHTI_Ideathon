import type { CategoryId, PublicRecord } from '../data/types';
import { CATEGORIES, LOCALITIES, DEPARTMENTS, SNAPSHOT_DATE } from '../data/reference';
import { daysBetween } from './format';

export interface DashboardFilters {
  state: string;
  city: string;
  localityId: string; // '' = all
  pin: string; // '' = all
  from: string; // ISO date
  to: string; // ISO date
  category: CategoryId | '';
}

const OPEN = new Set(['Submitted', 'Acknowledged', 'In Progress', 'Overdue', 'Reopened']);

export function applyFilters(records: PublicRecord[], f: DashboardFilters): PublicRecord[] {
  const pinLocalities = f.pin ? new Set(LOCALITIES.filter((l) => l.pin === f.pin).map((l) => l.id)) : null;
  return records.filter(
    (r) =>
      (!f.localityId || r.localityId === f.localityId) &&
      (!pinLocalities || pinLocalities.has(r.localityId)) &&
      (!f.category || r.category === f.category) &&
      (!f.from || r.received >= f.from) &&
      (!f.to || r.received <= f.to),
  );
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

export interface Summary {
  total: number;
  incidents: number;
  resolved: number;
  awaiting: number;
  actionReported: number;
  overdue: number;
  reopened: number;
  confirmed: number;
  disputed: number;
  medianDays: number | null;
  medianSample: number;
  missingResolutionDate: number;
}

export function summarize(records: PublicRecord[]): Summary {
  const resolvedRecords = records.filter((r) => r.status === 'Resolved');
  const durations = resolvedRecords
    .filter((r) => r.resolvedOn)
    .map((r) => daysBetween(r.received, r.resolvedOn!));
  return {
    total: records.length,
    incidents: new Set(records.map((r) => r.incidentId)).size,
    resolved: resolvedRecords.length,
    awaiting: records.filter((r) => OPEN.has(r.status)).length,
    actionReported: records.filter((r) => r.status === 'Action Reported').length,
    overdue: records.filter((r) => r.status === 'Overdue').length,
    reopened: records.filter((r) => r.status === 'Reopened').length,
    confirmed: records.filter((r) => r.feedback === 'confirmed').length,
    disputed: records.filter((r) => r.feedback === 'disputed').length,
    medianDays: median(durations),
    medianSample: durations.length,
    missingResolutionDate: resolvedRecords.length - durations.length,
  };
}

export function byCategory(records: PublicRecord[]) {
  return CATEGORIES.map((c) => ({
    id: c.id,
    label: c.label,
    count: records.filter((r) => r.category === c.id).length,
  })).filter((d) => d.count > 0);
}

const MONTHS = ['2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10'];
const MONTH_LABEL: Record<string, string> = {
  '2026-05': 'May',
  '2026-06': 'Jun',
  '2026-07': 'Jul',
  '2026-08': 'Aug',
  '2026-09': 'Sep',
  '2026-10': 'Oct*',
};

export function monthlyTrend(records: PublicRecord[]) {
  return MONTHS.map((m) => ({
    month: MONTH_LABEL[m],
    received: records.filter((r) => r.received.startsWith(m)).length,
    resolved: records.filter((r) => r.status === 'Resolved' && r.resolvedOn?.startsWith(m)).length,
  }));
}

export function byLocality(records: PublicRecord[]) {
  return LOCALITIES.map((l) => {
    const rs = records.filter((r) => r.localityId === l.id);
    const s = summarize(rs);
    return { locality: l, ...s };
  });
}

export function byDepartment(records: PublicRecord[]) {
  return DEPARTMENTS.map((d) => {
    const rs = records.filter((r) => r.departmentId === d.id);
    return { department: d, ...summarize(rs) };
  }).filter((d) => d.total > 0);
}

export interface RecurringProblem {
  key: string;
  localityId: string;
  category: CategoryId;
  landmark: string;
  reports: number;
  incidents: number;
  months: number;
  open: number;
  latest: string;
}

/** Same landmark + category reported as separate incidents in at least 3 different months. */
export function recurringProblems(records: PublicRecord[]): RecurringProblem[] {
  const groups = new Map<string, PublicRecord[]>();
  for (const r of records) {
    const key = `${r.localityId}|${r.category}|${r.landmark}`;
    const g = groups.get(key);
    if (g) g.push(r);
    else groups.set(key, [r]);
  }
  const out: RecurringProblem[] = [];
  for (const [key, rs] of groups) {
    const months = new Set(rs.map((r) => r.received.slice(0, 7))).size;
    const incidents = new Set(rs.map((r) => r.incidentId)).size;
    if (months < 3 || incidents < 3) continue;
    out.push({
      key,
      localityId: rs[0].localityId,
      category: rs[0].category,
      landmark: rs[0].landmark,
      reports: rs.length,
      incidents,
      months,
      open: rs.filter((r) => OPEN.has(r.status)).length,
      latest: rs.reduce((m, r) => (r.received > m ? r.received : m), ''),
    });
  }
  return out.sort((a, b) => b.incidents - a.incidents || b.reports - a.reports);
}

export function areaGlance(records: PublicRecord[], localityId: string, days = 90) {
  const from = new Date(Date.parse(SNAPSHOT_DATE) - days * 86_400_000).toISOString().slice(0, 10);
  const rs = records.filter((r) => (!localityId || r.localityId === localityId) && r.received >= from);
  return { from, ...summarize(rs) };
}
