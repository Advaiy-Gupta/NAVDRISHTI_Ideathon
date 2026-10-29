import type { CategoryId, ComplaintStatus, PublicRecord } from './types';
import { CATEGORIES, LOCALITIES, SNAPSHOT_DATE, resolveJurisdiction } from './reference';

/**
 * Synthetic, anonymised complaint records for the public dashboard.
 * Generated deterministically from a fixed seed so every visitor sees the same sample.
 * These numbers do NOT describe real municipal performance in Faridabad.
 */

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DAY = 86_400_000;
const toISO = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const snapshotMs = Date.parse(SNAPSHOT_DATE + 'T00:00:00Z');
const startMs = Date.parse('2026-05-01T00:00:00Z');

// Relative report volume per category and per locality (illustrative).
const CATEGORY_WEIGHT: Record<CategoryId, number> = {
  roads: 1.6,
  garbage: 1.5,
  water: 1.2,
  streetlights: 0.9,
  parking: 0.8,
  health: 0.35,
  education: 0.25,
  other: 0.3,
};
const LOCALITY_WEIGHT: Record<string, number> = {
  sec15: 0.9,
  nit: 1.4,
  oldfbd: 1.3,
  ballabgarh: 1.1,
  sec21: 0.8,
  greater: 1.0,
};
// Typical days to a recorded resolution, by department (illustrative).
const DEPT_SPEED: Record<string, number> = {
  'mc-roads': 22,
  'mda-roads': 34,
  'mc-sanitation': 4,
  'mc-water': 8,
  'mc-electrical': 9,
  traffic: 2,
  health: 25,
  education: 35,
  cpgrams: 30,
};

function generate(): PublicRecord[] {
  const rand = mulberry32(20261028);
  const records: PublicRecord[] = [];
  let incidentSeq = 0;
  const totalDays = Math.round((snapshotMs - startMs) / DAY);

  for (const loc of LOCALITIES) {
    for (const cat of CATEGORIES) {
      const expected = 11 * CATEGORY_WEIGHT[cat.id] * LOCALITY_WEIGHT[loc.id];
      const incidents = Math.max(1, Math.round(expected * (0.75 + rand() * 0.5)));
      for (let i = 0; i < incidents; i++) {
        let dayOffset = Math.floor(rand() * totalDays);
        // Monsoon: shift a share of road and drainage reports into July–August.
        if ((cat.id === 'roads' || cat.id === 'water') && rand() < 0.35) {
          dayOffset = 61 + Math.floor(rand() * 62);
        }
        const incidentId = `INC-${++incidentSeq}`;
        const landmark = loc.landmarks[Math.floor(rand() * loc.landmarks.length)];
        // Most incidents get one report; some attract duplicates from several residents.
        const r = rand();
        const reports = r < 0.62 ? 1 : r < 0.85 ? 2 : r < 0.95 ? 3 : 4;
        const j = resolveJurisdiction(cat.id, loc.id);
        const speed = DEPT_SPEED[j.departmentId] ?? 20;
        const resolveAfter = Math.max(1, Math.round(speed * (0.4 + rand() * 1.4)));
        const stuck = rand() < 0.1; // never reaches a recorded resolution in the window

        for (let k = 0; k < reports; k++) {
          const receivedMs = startMs + (dayOffset + Math.floor(rand() * 6) * k) * DAY;
          if (receivedMs > snapshotMs) continue;
          const age = Math.round((snapshotMs - receivedMs) / DAY);
          let status: ComplaintStatus;
          let resolvedOn: string | null = null;
          let feedback: PublicRecord['feedback'] = 'none';

          if (!stuck && resolveAfter <= age) {
            status = 'Resolved';
            resolvedOn = toISO(receivedMs + resolveAfter * DAY);
            const f = rand();
            if (f < 0.38) feedback = 'confirmed';
            else if (f < 0.49) feedback = 'disputed';
            if (feedback === 'disputed' && rand() < 0.45) {
              status = 'Reopened';
              resolvedOn = null;
            }
            // Some resolved records are missing their resolution date.
            if (status === 'Resolved' && rand() < 0.06) resolvedOn = null;
          } else {
            const progress = age / Math.max(resolveAfter, 1);
            if (age > cat.slaDays && rand() < 0.75) status = 'Overdue';
            else if (progress > 0.8) status = 'Action Reported';
            else if (progress > 0.45) status = 'In Progress';
            else if (progress > 0.15) status = 'Acknowledged';
            else status = 'Submitted';
          }

          records.push({
            id: `PR-${records.length + 1}`,
            incidentId,
            localityId: loc.id,
            category: cat.id,
            departmentId: j.departmentId,
            landmark,
            received: toISO(receivedMs),
            status,
            resolvedOn,
            feedback,
          });
        }
      }
    }
  }
  return records.sort((a, b) => a.received.localeCompare(b.received));
}

export const PUBLIC_RECORDS: PublicRecord[] = generate();

export const DATASET_META = {
  name: 'JanSeva sample grievance dataset (synthetic)',
  period: '1 May 2026 – 28 Oct 2026',
  lastUpdated: '28 Oct 2026, 18:00 IST',
  coverage: '6 localities of Faridabad, 8 complaint categories, 9 departments',
  source:
    'Synthetic records generated by the prototype from a fixed random seed. Not derived from any government system.',
};
