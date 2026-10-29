import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useLang } from '../state/i18n';
import { useStore } from '../state/store';
import { CATEGORIES, categoryLabel, departmentById, localityById } from '../data/reference';
import type { CategoryId, ComplaintStatus } from '../data/types';
import { formatDate } from '../lib/format';
import { SourceLabel, SourceLegend, StatusLabel } from '../components/Status';
import { EmptyState, PageHeader } from '../components/ui';
import { useGuideCheckpoint } from '../state/guide';

const STATUSES: ComplaintStatus[] = ['Submitted', 'Acknowledged', 'In Progress', 'Action Reported', 'Resolved', 'Reopened', 'Overdue'];

export default function ComplaintsPage() {
  const { t } = useLang();
  const { complaints } = useStore();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [category, setCategory] = useState<CategoryId | ''>('');
  const [status, setStatus] = useState<ComplaintStatus | ''>('');
  const [sort, setSort] = useState<'new' | 'old'>('new');
  useGuideCheckpoint('detail');

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return complaints
      .filter(
        (c) =>
          (!needle || c.title.toLowerCase().includes(needle) || c.ref.toLowerCase().includes(needle)) &&
          (!category || c.category === category) &&
          (!status || c.status === status),
      )
      .sort((a, b) => (sort === 'new' ? b.submittedOn.localeCompare(a.submittedOn) : a.submittedOn.localeCompare(b.submittedOn)));
  }, [complaints, q, category, status, sort]);

  const filtered = q || category || status;
  const counts = STATUSES.map((s) => [s, complaints.filter((c) => c.status === s).length] as const).filter(([, n]) => n > 0);

  return (
    <div>
      <PageHeader
        title={t('complaints.title')}
        lead="Complaints you have prepared with JanSeva and the latest status known for each. Select a complaint to see its timeline."
      >
        <Link to="/assistant" className="btn-primary">{t('nav.report')}</Link>
      </PageHeader>

      <div className="container-page py-6">
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
          <span><span className="font-semibold text-ink tnum">{complaints.length}</span> total</span>
          {counts.map(([s, n]) => (
            <button key={s} onClick={() => setStatus(status === s ? '' : s)} className={`tap hover:text-accent ${status === s ? 'text-accent underline' : ''}`}>
              <span className="font-semibold text-ink tnum">{n}</span> {s.toLowerCase()}
            </button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 border-y border-line py-3 sm:grid-cols-2 lg:grid-cols-[1fr_200px_180px_160px]">
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
            <label htmlFor="c-search" className="sr-only">{t('complaints.search')}</label>
            <input id="c-search" className="input pl-9" placeholder={t('complaints.search')} value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select aria-label="Filter by category" className="input" value={category} onChange={(e) => setCategory(e.target.value as CategoryId | '')}>
            <option value="">All categories</option>
            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <select aria-label="Filter by status" className="input" value={status} onChange={(e) => setStatus(e.target.value as ComplaintStatus | '')}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <select aria-label="Sort by date" className="input" value={sort} onChange={(e) => setSort(e.target.value as 'new' | 'old')}>
            <option value="new">Newest first</option>
            <option value="old">Oldest first</option>
          </select>
        </div>

        <div className="mt-4" data-guide="complaint-timeline">
          {rows.length === 0 ? (
            <EmptyState title={filtered ? 'No complaints match these filters' : 'No complaints yet'}>
              {filtered ? (
                <button className="link" onClick={() => { setQ(''); setCategory(''); setStatus(''); }}>Clear all filters</button>
              ) : (
                <Link to="/assistant" className="link">Report your first issue</Link>
              )}
            </EmptyState>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto border border-line bg-surface lg:block">
                <table className="table-base">
                  <thead>
                    <tr>
                      <th>Reference</th>
                      <th>Complaint</th>
                      <th>Department</th>
                      <th>Submitted</th>
                      <th>Last update</th>
                      <th>Status</th>
                      <th>Status source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((c) => (
                      <tr
                        key={c.id}
                        className="cursor-pointer hover:bg-canvas"
                        onClick={() => navigate(`/complaints/${c.id}`)}
                      >
                        <td className="whitespace-nowrap tnum text-xs">
                          <Link to={`/complaints/${c.id}`} className="link" onClick={(e) => e.stopPropagation()}>{c.ref}</Link>
                        </td>
                        <td>
                          <div className="font-medium">{c.title}</div>
                          <div className="text-xs text-muted">{categoryLabel(c.category)} · {localityById(c.localityId)?.name ?? c.city}</div>
                        </td>
                        <td className="text-xs">{departmentById(c.departmentId)?.shortName}</td>
                        <td className="whitespace-nowrap tnum text-xs">{formatDate(c.submittedOn)}</td>
                        <td className="whitespace-nowrap tnum text-xs">{formatDate(c.lastUpdate)}</td>
                        <td><StatusLabel status={c.status} /></td>
                        <td><SourceLabel source={c.statusSource} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile list */}
              <ul className="divide-y divide-line border-y border-line bg-surface lg:hidden">
                {rows.map((c) => (
                  <li key={c.id}>
                    <Link to={`/complaints/${c.id}`} className="block px-3 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-sm font-medium">{c.title}</span>
                        <StatusLabel status={c.status} />
                      </div>
                      <div className="mt-1 text-xs text-muted tnum">{c.ref}</div>
                      <div className="text-xs text-muted">
                        {localityById(c.localityId)?.name} · {departmentById(c.departmentId)?.shortName}
                      </div>
                      <div className="mt-1 flex justify-between text-xs">
                        <span className="text-muted tnum">Submitted {formatDate(c.submittedOn)} · updated {formatDate(c.lastUpdate)}</span>
                        <SourceLabel source={c.statusSource} />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="mt-8 border-t border-line pt-4">
          <h2 className="eyebrow mb-3">How to read the status source</h2>
          <SourceLegend />
        </div>
      </div>
    </div>
  );
}
