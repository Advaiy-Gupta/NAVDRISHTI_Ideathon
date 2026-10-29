import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLang } from '../state/i18n';
import { PUBLIC_RECORDS, DATASET_META } from '../data/publicDataset';
import { CATEGORIES, LOCALITIES, categoryLabel, localityById, SNAPSHOT_DATE, DATASET_START } from '../data/reference';
import type { CategoryId } from '../data/types';
import {
  applyFilters,
  byCategory,
  byDepartment,
  byLocality,
  monthlyTrend,
  recurringProblems,
  summarize,
  type DashboardFilters,
} from '../lib/metrics';
import { formatDate, formatNumber, pct } from '../lib/format';
import { CategoryBarChart, TrendChart } from '../components/dashboard/Charts';
import { Notice, PageHeader } from '../components/ui';

const PINS = [...new Set(LOCALITIES.map((l) => l.pin))].sort();

const DEFINITIONS: { term: string; def: string }[] = [
  { term: 'Complaints registered', def: 'Every complaint record received in the period. Several residents may report the same problem, so complaints are not the same as distinct incidents; duplicates are grouped for analysis but never deleted.' },
  { term: 'Recorded as resolved', def: 'Complaints whose latest recorded status is “Resolved”, as reported by the department. This does not mean a citizen has confirmed the fix.' },
  { term: 'Awaiting action', def: 'Complaints whose latest status is Submitted, Acknowledged, In Progress, Overdue or Reopened. Complaints where the department has reported action but not closed the complaint are counted separately.' },
  { term: 'Overdue', def: 'Open complaints older than the illustrative service timeline for their category (e.g. 3 days for parking, 15 days for roads). Included within “Awaiting action”.' },
  { term: 'Citizen-confirmed resolutions', def: 'Complaints where the complainant confirmed the problem was fixed. Citizens who did not respond are not counted as confirmations.' },
  { term: 'Median recorded resolution time', def: 'Median number of days between receipt and the recorded resolution date, for resolved complaints that have both dates. Complaints with a missing resolution date are excluded, not treated as zero.' },
];

function Metric({ label, value, sub, def, tone }: { label: string; value: string; sub?: string; def: string; tone?: 'crit' | 'ok' }) {
  return (
    <div className="border-b border-r border-line px-4 py-3.5">
      <dt className="text-xs font-medium text-muted">{label}</dt>
      <dd className={`mt-1 text-2xl font-semibold tnum ${tone === 'crit' ? 'text-crit' : tone === 'ok' ? 'text-ok' : ''}`}>{value}</dd>
      {sub && <dd className="text-xs text-ink tnum">{sub}</dd>}
      <dd className="mt-1.5 text-[11px] leading-snug text-muted">{def}</dd>
    </div>
  );
}

/** Phone layout for a comparison-table row. */
function MobileStatRow({
  title,
  subtitle,
  stats,
  active,
  onSelect,
}: {
  title: string;
  subtitle: string;
  stats: [string, string, boolean?][];
  active?: boolean;
  onSelect?: () => void;
}) {
  return (
    <li className={`px-4 py-3 ${active ? 'bg-accent-tint' : ''}`}>
      {onSelect ? (
        <button onClick={onSelect} aria-pressed={active} className="link tap text-left font-medium">
          {title}
        </button>
      ) : (
        <div className="font-medium">{title}</div>
      )}
      <div className="text-xs text-muted tnum">{subtitle}</div>
      <dl className="mt-2 grid grid-cols-3 gap-x-3 gap-y-2">
        {stats.map(([k, v, crit]) => (
          <div key={k}>
            <dt className="text-[11px] text-muted">{k}</dt>
            <dd className={`text-sm tnum ${crit ? 'text-crit' : ''}`}>{v}</dd>
          </div>
        ))}
      </dl>
    </li>
  );
}

export default function PublicDashboardPage() {
  const { t } = useLang();
  const [params] = useSearchParams();
  const initialLocality = params.get('locality') ?? '';
  const [f, setF] = useState<DashboardFilters>({
    state: 'Haryana',
    city: 'Faridabad',
    localityId: localityById(initialLocality) ? initialLocality : '',
    pin: '',
    from: DATASET_START,
    to: SNAPSHOT_DATE,
    category: '',
  });
  const set = (p: Partial<DashboardFilters>) => setF((x) => ({ ...x, ...p }));
  const reset = () => set({ localityId: '', pin: '', from: DATASET_START, to: SNAPSHOT_DATE, category: '' });

  const records = useMemo(() => applyFilters(PUBLIC_RECORDS, f), [f]);
  // Comparison tables ignore the locality filter so localities can be compared side by side.
  const compareRecords = useMemo(() => applyFilters(PUBLIC_RECORDS, { ...f, localityId: '', pin: '' }), [f]);
  const s = useMemo(() => summarize(records), [records]);
  const cats = useMemo(() => byCategory(applyFilters(PUBLIC_RECORDS, { ...f, category: '' })), [f]);
  const trend = useMemo(() => monthlyTrend(records), [records]);
  const locs = useMemo(() => byLocality(compareRecords), [compareRecords]);
  const depts = useMemo(() => byDepartment(records), [records]);
  const recurring = useMemo(() => recurringProblems(records).slice(0, 8), [records]);

  const activeFilters = [
    f.localityId && localityById(f.localityId)?.name,
    f.pin && `PIN ${f.pin}`,
    f.category && categoryLabel(f.category),
    (f.from !== DATASET_START || f.to !== SNAPSHOT_DATE) && `${formatDate(f.from)} – ${formatDate(f.to)}`,
  ].filter(Boolean) as string[];

  const sel = 'input py-1.5';
  // On phones the filter grid is collapsed behind a toggle; it is always shown from md up.
  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    <div>
      <PageHeader title={t('dashboard.title')} lead={t('dashboard.subtitle')} />

      <div className="container-page py-5">
        <Notice tone="warn" title="Sample data">
          All figures on this page come from a synthetic dataset generated for this prototype. They do not describe the actual performance of any Faridabad authority.
        </Notice>

        {/* Filters */}
        <section aria-label="Filters" className="mt-5 border-y border-line bg-surface px-3 py-3">
          <button
            className="btn-secondary w-full justify-between md:hidden"
            onClick={() => setFiltersOpen((o) => !o)}
            aria-expanded={filtersOpen}
            aria-controls="dashboard-filters"
          >
            <span>Filters{activeFilters.length ? ` (${activeFilters.length} active)` : ''}</span>
            <span aria-hidden>{filtersOpen ? '−' : '+'}</span>
          </button>
          <div id="dashboard-filters" className={`${filtersOpen ? 'mt-3 grid' : 'hidden'} grid-cols-2 gap-3 md:mt-0 md:grid md:grid-cols-4 xl:grid-cols-7`}>
            <div>
              <label htmlFor="d-state" className="label text-xs">State</label>
              <select id="d-state" className={sel} value={f.state} onChange={(e) => set({ state: e.target.value })}>
                <option>Haryana</option>
              </select>
            </div>
            <div>
              <label htmlFor="d-city" className="label text-xs">City</label>
              <select id="d-city" className={sel} value={f.city} onChange={(e) => set({ city: e.target.value })}>
                <option>Faridabad</option>
              </select>
            </div>
            <div>
              <label htmlFor="d-loc" className="label text-xs">Ward / locality</label>
              <select id="d-loc" className={sel} value={f.localityId} onChange={(e) => set({ localityId: e.target.value })}>
                <option value="">All localities</option>
                {LOCALITIES.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="d-pin" className="label text-xs">PIN code</label>
              <select id="d-pin" className={`${sel} tnum`} value={f.pin} onChange={(e) => set({ pin: e.target.value })}>
                <option value="">All</option>
                {PINS.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="d-from" className="label text-xs">From</label>
              <input id="d-from" type="date" className={sel} min={DATASET_START} max={f.to} value={f.from} onChange={(e) => set({ from: e.target.value || DATASET_START })} />
            </div>
            <div>
              <label htmlFor="d-to" className="label text-xs">To</label>
              <input id="d-to" type="date" className={sel} min={f.from} max={SNAPSHOT_DATE} value={f.to} onChange={(e) => set({ to: e.target.value || SNAPSHOT_DATE })} />
            </div>
            <div>
              <label htmlFor="d-cat" className="label text-xs">Category</label>
              <select id="d-cat" className={sel} value={f.category} onChange={(e) => set({ category: e.target.value as CategoryId | '' })}>
                <option value="">All categories</option>
                {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            <span>
              Reporting period: <span className="text-ink tnum">{formatDate(f.from)} – {formatDate(f.to)}</span>
            </span>
            <span aria-hidden>·</span>
            <span>{activeFilters.length ? `Filtered by ${activeFilters.join(', ')}` : 'Showing all sample records'}</span>
            {activeFilters.length > 0 && (
              <button onClick={reset} className="link">Clear filters</button>
            )}
          </div>
        </section>

        {/* Headline metrics */}
        <dl className="mt-5 grid grid-cols-2 border-l border-t border-line bg-surface lg:grid-cols-3 xl:grid-cols-6">
          <Metric label="Complaints registered" value={formatNumber(s.total)} sub={`${formatNumber(s.incidents)} distinct incidents`} def="All complaint records in the period." />
          <Metric label="Recorded as resolved" value={formatNumber(s.resolved)} sub={`${pct(s.resolved, s.total)} of complaints`} def="Latest status “Resolved”, per department." />
          <Metric label="Awaiting action" value={formatNumber(s.awaiting)} sub={`+ ${formatNumber(s.actionReported)} with action reported`} def="Not yet acted on or reopened." />
          <Metric label="Overdue" value={formatNumber(s.overdue)} sub={`${pct(s.overdue, s.total)} of complaints`} def="Open beyond the category's sample timeline." tone={s.overdue > 0 ? 'crit' : undefined} />
          <Metric label="Citizen-confirmed resolutions" value={formatNumber(s.confirmed)} sub={`${formatNumber(s.disputed)} disputed by citizens`} def="Fix confirmed by the complainant." />
          <Metric
            label="Median recorded resolution time"
            value={s.medianDays === null ? 'No data' : `${s.medianDays} days`}
            sub={`n = ${formatNumber(s.medianSample)}; ${formatNumber(s.missingResolutionDate)} missing a date`}
            def="Receipt to recorded resolution date."
          />
        </dl>

        {/* Charts */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="panel p-4">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="section-title">Complaints by category</h2>
              {f.category && <button className="link text-xs" onClick={() => set({ category: '' })}>Show all categories</button>}
            </div>
            <p className="mb-2 text-xs text-muted">Select a bar to filter the whole dashboard by that category.</p>
            {cats.length ? (
              <CategoryBarChart data={cats} selected={f.category} onSelect={(id) => set({ category: f.category === id ? '' : id })} />
            ) : (
              <p className="py-10 text-center text-sm text-muted">No complaints match these filters.</p>
            )}
            <details className="mt-2 text-xs">
              <summary className="cursor-pointer text-accent">View as table</summary>
              <table className="table-base mt-2">
                <thead><tr><th>Category</th><th className="text-right">Complaints</th></tr></thead>
                <tbody>{cats.map((c) => <tr key={c.id}><td>{c.label}</td><td className="text-right tnum">{c.count}</td></tr>)}</tbody>
              </table>
            </details>
          </section>
          <section className="panel p-4">
            <h2 className="section-title">Received and recorded as resolved, by month</h2>
            <p className="mb-2 text-xs text-muted">
              Resolved counts are by month of the recorded resolution date. *October is partial (to 28 Oct).
            </p>
            <TrendChart data={trend} />
            <details className="mt-2 text-xs">
              <summary className="cursor-pointer text-accent">View as table</summary>
              <table className="table-base mt-2">
                <thead><tr><th>Month</th><th className="text-right">Received</th><th className="text-right">Recorded as resolved</th></tr></thead>
                <tbody>{trend.map((r) => <tr key={r.month}><td>{r.month}</td><td className="text-right tnum">{r.received}</td><td className="text-right tnum">{r.resolved}</td></tr>)}</tbody>
              </table>
            </details>
          </section>
        </div>

        {/* Locality comparison */}
        <section className="mt-8">
          <h2 className="section-title">Ward and locality comparison</h2>
          <p className="mt-0.5 text-xs text-muted">
            Same period and category as above, across all localities. Select a locality to filter the dashboard. Higher complaint volume can reflect population, road length or reporting habits — not necessarily worse service.
          </p>
          <ul className="mt-3 divide-y divide-line border border-line bg-surface md:hidden">
            {locs.map((l) => (
              <MobileStatRow
                key={l.locality.id}
                active={f.localityId === l.locality.id}
                onSelect={() => set({ localityId: f.localityId === l.locality.id ? '' : l.locality.id, pin: '' })}
                title={l.locality.name}
                subtitle={`${l.locality.ward} · ${l.locality.pin}`}
                stats={[
                  ['Complaints', `${l.total}`],
                  ['Incidents', `${l.incidents}`],
                  ['Awaiting', `${l.awaiting}`],
                  ['Overdue', `${l.overdue}`, l.overdue > 0],
                  ['Resolved', `${l.resolved} (${pct(l.resolved, l.total)})`],
                  ['Median days', `${l.medianDays ?? '—'} (n ${l.medianSample})`],
                ]}
              />
            ))}
          </ul>
          <div className="mt-3 hidden overflow-x-auto border border-line bg-surface md:block">
            <table className="table-base min-w-[860px]">
              <thead>
                <tr>
                  <th>Locality</th>
                  <th>Ward · PIN</th>
                  <th className="text-right">Complaints</th>
                  <th className="text-right">Incidents</th>
                  <th className="text-right">Awaiting</th>
                  <th className="text-right">Overdue</th>
                  <th className="text-right">Recorded resolved</th>
                  <th className="text-right">Median days (n)</th>
                  <th className="text-right">Disputed</th>
                </tr>
              </thead>
              <tbody>
                {locs.map((l) => (
                  <tr key={l.locality.id} className={f.localityId === l.locality.id ? 'bg-accent-tint' : 'hover:bg-canvas'}>
                    <td>
                      <button className="link text-left" onClick={() => set({ localityId: f.localityId === l.locality.id ? '' : l.locality.id, pin: '' })}>
                        {l.locality.name}
                      </button>
                    </td>
                    <td className="text-xs text-muted tnum">{l.locality.ward} · {l.locality.pin}</td>
                    <td className="text-right tnum">{l.total}</td>
                    <td className="text-right tnum">{l.incidents}</td>
                    <td className="text-right tnum">{l.awaiting}</td>
                    <td className={`text-right tnum ${l.overdue ? 'text-crit' : ''}`}>{l.overdue}</td>
                    <td className="text-right tnum">{l.resolved} <span className="text-xs text-muted">({pct(l.resolved, l.total)})</span></td>
                    <td className="text-right tnum">{l.medianDays ?? '—'} <span className="text-xs text-muted">({l.medianSample})</span></td>
                    <td className="text-right tnum">{l.disputed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          {/* Department response */}
          <section>
            <h2 className="section-title">Department response</h2>
            <p className="mt-0.5 text-xs text-muted">
              Describes recorded outcomes for complaints routed to each department. Departments handle different kinds of work, so resolution times are not directly comparable across them. No individual officer is assessed.
            </p>
            <ul className="mt-3 divide-y divide-line border border-line bg-surface md:hidden">
              {depts.map((d) => (
                <MobileStatRow
                  key={d.department.id}
                  title={d.department.shortName}
                  subtitle={d.department.parent}
                  stats={[
                    ['Complaints', `${d.total}`],
                    ['Resolved', pct(d.resolved, d.total)],
                    ['Median days', `${d.medianDays ?? '—'} (n ${d.medianSample})`],
                    ['Awaiting', `${d.awaiting}`],
                    ['Overdue', `${d.overdue}`, d.overdue > 0],
                    ['Disputed', `${d.disputed}`],
                  ]}
                />
              ))}
              {depts.length === 0 && <li className="px-4 py-6 text-center text-sm text-muted">No complaints match these filters.</li>}
            </ul>
            <div className="mt-3 hidden overflow-x-auto border border-line bg-surface md:block">
              <table className="table-base min-w-[640px]">
                <thead>
                  <tr>
                    <th>Department</th>
                    <th className="text-right">Complaints</th>
                    <th className="text-right">Recorded resolved</th>
                    <th className="text-right">Median days (n)</th>
                    <th className="text-right">Awaiting</th>
                    <th className="text-right">Overdue</th>
                    <th className="text-right">Disputed</th>
                  </tr>
                </thead>
                <tbody>
                  {depts.map((d) => (
                    <tr key={d.department.id}>
                      <td>
                        <div>{d.department.shortName}</div>
                        <div className="text-xs text-muted">{d.department.parent}</div>
                      </td>
                      <td className="text-right tnum">{d.total}</td>
                      <td className="text-right tnum">{pct(d.resolved, d.total)}</td>
                      <td className="text-right tnum">{d.medianDays ?? '—'} <span className="text-xs text-muted">({d.medianSample})</span></td>
                      <td className="text-right tnum">{d.awaiting}</td>
                      <td className={`text-right tnum ${d.overdue ? 'text-crit' : ''}`}>{d.overdue}</td>
                      <td className="text-right tnum">{d.disputed}</td>
                    </tr>
                  ))}
                  {depts.length === 0 && (
                    <tr><td colSpan={7} className="py-6 text-center text-muted">No complaints match these filters.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs">
              <Link to="/authorities" className="link">Find the office responsible for each locality</Link>
            </p>
          </section>

          {/* Recurring problems */}
          <section>
            <h2 className="section-title">Recurring problems by locality</h2>
            <p className="mt-0.5 text-xs text-muted">
              The same category at the same landmark, reported as at least 3 separate incidents across at least 3 different months.
            </p>
            {recurring.length === 0 ? (
              <p className="mt-3 border border-dashed border-line bg-surface px-4 py-6 text-center text-sm text-muted">
                No recurring problems in this selection.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-line border-y border-line bg-surface">
                {recurring.map((r) => (
                  <li key={r.key} className="px-3 py-2.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm font-medium">{categoryLabel(r.category)} — {r.landmark}</span>
                      <span className="whitespace-nowrap text-xs text-muted tnum">{r.incidents} incidents</span>
                    </div>
                    <div className="mt-0.5 text-xs text-muted tnum">
                      <button className="link tap md:min-h-0" onClick={() => set({ localityId: r.localityId, pin: '' })}>{localityById(r.localityId)?.name}</button>
                      {' · '}{r.reports} complaints over {r.months} months · {r.open} still open · latest {formatDate(r.latest)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Definitions and source */}
        <section className="mt-10 grid grid-cols-1 gap-8 border-t border-line pt-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div>
            <h2 className="section-title">Metric definitions</h2>
            <dl className="mt-3 space-y-3 text-sm">
              {DEFINITIONS.map((d) => (
                <div key={d.term}>
                  <dt className="font-medium">{d.term}</dt>
                  <dd className="text-muted">{d.def}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <h2 className="section-title">Data source and coverage</h2>
            <dl className="mt-3 divide-y divide-line border-y border-line text-sm">
              {[
                ['Dataset', DATASET_META.name],
                ['Source', DATASET_META.source],
                ['Coverage', DATASET_META.coverage],
                ['Period', DATASET_META.period],
                ['Last updated', DATASET_META.lastUpdated],
                ['Records', `${formatNumber(PUBLIC_RECORDS.length)} complaints, ${formatNumber(new Set(PUBLIC_RECORDS.map((r) => r.incidentId)).size)} incidents`],
                ['Privacy', 'Records contain no names, phone numbers or exact addresses. Locations are shown only at landmark level.'],
              ].map(([k, v]) => (
                <div key={k} className="grid grid-cols-[100px_1fr] gap-3 py-2">
                  <dt className="text-muted">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
            <h3 className="mt-5 text-sm font-medium">Limitations</h3>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-muted">
              <li>Complaint volume reflects reporting behaviour as well as the condition of services.</li>
              <li>Statuses are as recorded by departments; JanSeva cannot independently confirm work was done.</li>
              <li>Service timelines used for “Overdue” are illustrative, not notified standards.</li>
              <li>Your own demo records are not included in these figures.</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
