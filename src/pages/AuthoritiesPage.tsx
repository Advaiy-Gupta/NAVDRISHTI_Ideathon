import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useLang } from '../state/i18n';
import { AUTHORITIES, serviceById } from '../data/directory';
import { CATEGORIES, LOCALITIES, departmentById, localityById, resolveJurisdiction } from '../data/reference';
import { EmptyState, Notice, PageHeader, PortalLink, UrlStatusLabel } from '../components/ui';
import type { AuthorityRecord } from '../data/types';

function AuthorityRow({ a }: { a: AuthorityRecord }) {
  const dept = departmentById(a.departmentId);
  const channel = serviceById(a.grievanceChannelId);
  return (
    <li className="grid grid-cols-1 gap-4 px-4 py-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)]">
      <div>
        <div className="font-medium">{a.office}</div>
        <div className="text-xs text-muted">{dept?.name}</div>
        <p className="mt-1.5 text-sm">{a.role}</p>
        <div className="mt-1 text-xs text-muted">Jurisdiction: {a.jurisdiction}</div>
      </div>
      <dl className="space-y-1 text-sm">
        <div><dt className="inline text-muted">Officer: </dt><dd className="inline">{a.officerName}</dd></div>
        <div><dt className="inline text-muted">Email: </dt><dd className="inline break-all">{a.email}</dd></div>
        <div><dt className="inline text-muted">Phone: </dt><dd className="inline">{a.phone}</dd></div>
      </dl>
      <dl className="space-y-1 text-sm">
        <div>
          <dt className="inline text-muted">Website: </dt>
          <dd className="inline"><PortalLink url={a.website} status={a.websiteStatus}>Open</PortalLink> <UrlStatusLabel status={a.websiteStatus} /></dd>
        </div>
        {channel && (
          <div>
            <dt className="inline text-muted">Grievance channel: </dt>
            <dd className="inline">{channel.name}</dd>
          </div>
        )}
        <div className="pt-1 text-xs text-muted">
          <div>Source: {a.source}</div>
          <div>Verification: {a.verifiedOn || 'Not verified — sample record'}</div>
        </div>
      </dl>
    </li>
  );
}

export default function AuthoritiesPage() {
  const { t } = useLang();
  const [q, setQ] = useState('');
  const [localityId, setLocalityId] = useState('sec15');

  const list = useMemo(() => {
    const n = q.trim().toLowerCase();
    return AUTHORITIES.filter((a) => {
      if (!n) return true;
      const dept = departmentById(a.departmentId);
      return [a.office, a.jurisdiction, a.role, dept?.name, dept?.shortName].join(' ').toLowerCase().includes(n);
    });
  }, [q]);

  const loc = localityById(localityId);
  const responsible = CATEGORIES.filter((c) => c.id !== 'other').map((c) => {
    const j = resolveJurisdiction(c.id, localityId);
    const office = AUTHORITIES.find((a) => a.departmentId === j.departmentId && a.localityIds.includes(localityId));
    return { category: c, departmentId: j.departmentId, office };
  });

  return (
    <div>
      <PageHeader
        title={t('authorities.title')}
        lead="Which public office is responsible for which kind of problem in your area, and how to reach it through official channels."
      />
      <div className="container-page py-6">
        <Notice tone="warn" title="Sample records">
          Office designations reflect common administrative roles, but officer names and contact details are fictional and jurisdictions are illustrative. Contact addresses use the reserved example.org domain and will not reach anyone.
        </Notice>

        <section className="mt-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="section-title">Who is responsible in my area?</h2>
              <p className="text-xs text-muted">Based on the sample jurisdiction rules used by the assistant.</p>
            </div>
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <label htmlFor="a-loc" className="text-sm text-muted">Locality</label>
              <select id="a-loc" className="input min-w-0 flex-1 sm:w-auto sm:flex-none" value={localityId} onChange={(e) => setLocalityId(e.target.value)}>
                {LOCALITIES.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
          </div>
          {loc && <p className="mt-2 text-xs text-muted tnum">{loc.name} · {loc.ward} · PIN {loc.pin} · {loc.zone}</p>}
          <div className="mt-3 overflow-x-auto border border-line bg-surface">
            <table className="table-base md:min-w-[640px]">
              <thead>
                <tr><th>Problem</th><th>Responsible department</th><th>Office</th></tr>
              </thead>
              <tbody>
                {responsible.map((r) => (
                  <tr key={r.category.id}>
                    <td>{r.category.label}</td>
                    <td>{departmentById(r.departmentId)?.shortName}</td>
                    <td className="text-sm">{r.office ? r.office.office : <span className="text-muted">No sample office record</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="section-title">All offices</h2>
            <div className="relative w-full sm:w-80">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
              <label htmlFor="a-search" className="sr-only">Search offices</label>
              <input id="a-search" className="input pl-9" placeholder="Search office, department or area" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>
          <p className="mt-1 text-xs text-muted tnum">{list.length} of {AUTHORITIES.length} records</p>
          {list.length ? (
            <ul className="mt-3 divide-y divide-line border border-line bg-surface">
              {list.map((a) => <AuthorityRow key={a.id} a={a} />)}
            </ul>
          ) : (
            <div className="mt-3">
              <EmptyState title="No offices match your search">
                <button className="link" onClick={() => setQ('')}>Clear search</button>
              </EmptyState>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
