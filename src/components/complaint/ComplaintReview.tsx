import type { ComplaintDraft } from '../../data/types';
import { categoryLabel, departmentById, localityById } from '../../data/reference';
import { serviceById } from '../../data/directory';
import { formatDate } from '../../lib/format';
import { UrlStatusLabel } from '../ui';

export function DraftSummary({ draft: d }: { draft: ComplaintDraft }) {
  const loc = localityById(d.localityId);
  const svc = serviceById(d.serviceId);
  const rows: [string, React.ReactNode][] = [
    ['Title', d.title],
    ['Category', categoryLabel(d.category)],
    ['Location', [d.landmark, loc?.name, d.city, d.state].filter(Boolean).join(', ')],
    ['Ward / PIN', <span className="tnum">{[d.ward, d.pin].filter(Boolean).join(' · ')}</span>],
    ['Coordinates', d.coordinates || 'Not provided'],
    ['First noticed', formatDate(d.incidentDate)],
    ['Department', departmentById(d.departmentId)?.name],
    ['Official channel', svc ? <span>{svc.name} <UrlStatusLabel status={svc.urlStatus} /></span> : '—'],
    ['Photo', d.photoUrl ? <img src={d.photoUrl} alt="Evidence preview" className="h-20 w-28 border border-line object-cover" /> : d.photoName || 'None attached'],
  ];
  return (
    <dl className="divide-y divide-line">
      {rows.map(([k, v]) => (
        <div key={k} className="grid grid-cols-[130px_1fr] gap-3 px-4 py-2.5 text-sm">
          <dt className="text-muted">{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function ComplaintReview({ draft, onEdit, onConfirm }: { draft: ComplaintDraft; onEdit: () => void; onConfirm: () => void }) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <section className="panel">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="section-title">Details</h2>
          <button className="btn-ghost text-sm" onClick={onEdit}>Edit</button>
        </div>
        <DraftSummary draft={draft} />
      </section>
      <section className="panel flex flex-col">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="section-title">Complaint text</h2>
          <button className="btn-ghost text-sm" onClick={onEdit}>Edit</button>
        </div>
        <pre className="flex-1 whitespace-pre-wrap px-4 py-3 font-sans text-sm leading-relaxed">{draft.complaintText}</pre>
        <div className="border-t border-line px-4 py-3">
          <p className="mb-3 text-xs text-muted">
            Check that the description is accurate and contains no personal information you do not want to share. The next step shows how to submit it on the official channel.
          </p>
          <div className="flex flex-wrap gap-2">
            <button className="btn-primary" onClick={onConfirm} data-guide="review-confirm">Looks correct — show submission steps</button>
            <button className="btn-secondary" onClick={onEdit}>Back to edit</button>
          </div>
        </div>
      </section>
    </div>
  );
}
