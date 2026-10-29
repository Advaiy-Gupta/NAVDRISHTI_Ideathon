import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useLang } from '../state/i18n';
import { SERVICES, SERVICE_CATEGORIES } from '../data/directory';
import type { IntegrationLevel, ServiceCategory, ServiceEntry } from '../data/types';
import { formatDate } from '../lib/format';
import { EmptyState, PageHeader, PortalLink, UrlStatusLabel } from '../components/ui';

const INTEGRATION: Record<IntegrationLevel, { label: string; desc: string }> = {
  'direct-planned': { label: 'Direct integration planned', desc: 'Not live in this prototype. JanSeva currently prepares the complaint for you to submit.' },
  prepare: { label: 'JanSeva prepares complaint', desc: 'JanSeva drafts the complaint; you submit it on the official portal.' },
  link: { label: 'Link only', desc: 'JanSeva points you to the official service; no complaint preparation.' },
};

function ServiceRow({ s }: { s: ServiceEntry }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="px-4 py-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="text-xs text-muted">{s.directoryCategory}</div>
          <h3 className="font-medium">{s.name}</h3>
          <div className="text-xs text-muted">{s.department} · {s.jurisdiction}</div>
          <p className="mt-1.5 max-w-2xl text-sm">{s.purpose}</p>
        </div>
        <div className="shrink-0 space-y-1 text-sm md:w-64 md:text-right">
          <PortalLink url={s.url} status={s.urlStatus} className="btn-secondary py-1.5">Open official channel</PortalLink>
          <div><UrlStatusLabel status={s.urlStatus} /></div>
          <div className="text-xs" title={INTEGRATION[s.integration].desc}>{INTEGRATION[s.integration].label}</div>
        </div>
      </div>
      <button className="btn-ghost -ml-2 mt-2 text-xs" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        {open ? 'Hide details' : 'Requirements and verification'}
      </button>
      {open && (
        <dl className="mt-2 grid grid-cols-1 gap-x-6 gap-y-2 border-t border-line pt-3 text-sm md:grid-cols-2">
          <div>
            <dt className="text-xs font-medium text-muted">Information or documents required</dt>
            <dd><ul className="mt-0.5 list-disc pl-5">{s.requirements.map((r) => <li key={r}>{r}</li>)}</ul></dd>
          </div>
          <div className="space-y-2">
            <div><dt className="text-xs font-medium text-muted">Submission method</dt><dd>{s.submissionMethod}</dd></div>
            <div><dt className="text-xs font-medium text-muted">JanSeva support</dt><dd>{INTEGRATION[s.integration].desc}</dd></div>
            <div><dt className="text-xs font-medium text-muted">URL</dt><dd className="break-all text-xs tnum">{s.url}</dd></div>
            <div>
              <dt className="text-xs font-medium text-muted">Last verified</dt>
              <dd>{formatDate(s.lastVerified)} — <span className="text-muted">{s.verificationNote}</span></dd>
            </div>
          </div>
        </dl>
      )}
    </li>
  );
}

export default function ServicesPage() {
  const { t } = useLang();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<ServiceCategory | ''>('');

  const list = useMemo(() => {
    const n = q.trim().toLowerCase();
    return SERVICES.filter(
      (s) =>
        (!cat || s.directoryCategory === cat) &&
        (!n || [s.name, s.department, s.purpose, s.jurisdiction].join(' ').toLowerCase().includes(n)),
    );
  }, [q, cat]);

  return (
    <div>
      <PageHeader
        title={t('services.title')}
        lead="Official portals and service channels, with what each is for and what you need. Links marked “Official domain” open the government website; “Mock link” entries are placeholders in this prototype."
      />
      <div className="container-page grid grid-cols-1 gap-6 py-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav aria-label="Service categories" className="lg:sticky lg:top-20 lg:self-start">
          <div className="eyebrow mb-2">Categories</div>
          <ul className="flex gap-1 overflow-x-auto pb-1 text-sm lg:flex-col lg:overflow-visible">
            {(['', ...SERVICE_CATEGORIES] as const).map((c) => {
              const count = c ? SERVICES.filter((s) => s.directoryCategory === c).length : SERVICES.length;
              return (
                <li key={c || 'all'}>
                  <button
                    onClick={() => setCat(c)}
                    aria-pressed={cat === c}
                    className={`flex w-full items-center justify-between gap-3 whitespace-nowrap border-l-2 px-3 py-2.5 text-left lg:py-1.5 ${
                      cat === c ? 'border-accent bg-accent-tint font-medium text-accent' : 'border-transparent hover:bg-surface'
                    }`}
                  >
                    {c || 'All services'} <span className="text-xs text-muted tnum">{count}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
        <div>
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
            <label htmlFor="s-search" className="sr-only">{t('services.search')}</label>
            <input id="s-search" className="input pl-9" placeholder={t('services.search')} value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <p className="mt-2 text-xs text-muted tnum">{list.length} of {SERVICES.length} services</p>
          {list.length ? (
            <ul className="mt-3 divide-y divide-line border border-line bg-surface">
              {list.map((s) => <ServiceRow key={s.id} s={s} />)}
            </ul>
          ) : (
            <div className="mt-3">
              <EmptyState title="No services match">
                <button className="link" onClick={() => { setQ(''); setCat(''); }}>Clear search and category</button>
              </EmptyState>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
