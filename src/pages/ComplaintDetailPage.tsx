import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { useStore } from '../state/store';
import { categoryLabel, departmentById, localityById } from '../data/reference';
import { serviceById } from '../data/directory';
import type { Complaint, ComplaintStatus, TimelineEvent, TimelineStage } from '../data/types';
import { formatDate, formatDateTime } from '../lib/format';
import { SourceLabel, StatusLabel, VerificationLabel } from '../components/Status';
import { EmptyState, Notice, PortalLink, UrlStatusLabel } from '../components/ui';
import { useGuideCheckpoint } from '../state/guide';

const MILESTONES: { stage: TimelineStage; label: string; alt?: TimelineStage[] }[] = [
  { stage: 'prepared', label: 'Complaint prepared' },
  { stage: 'submitted', label: 'Submission recorded' },
  { stage: 'acknowledged', label: 'Acknowledgement received' },
  { stage: 'assigned', label: 'Assigned to department' },
  { stage: 'action', label: 'Action reported', alt: ['resolved'] },
  { stage: 'verification', label: 'Citizen verification', alt: ['disputed'] },
];

const STAGE_LABEL: Record<TimelineStage, string> = {
  prepared: 'Complaint prepared',
  submitted: 'Submission recorded',
  acknowledged: 'Acknowledged',
  assigned: 'Assigned',
  action: 'Action reported',
  resolved: 'Marked resolved by department',
  verification: 'Resolution confirmed by citizen',
  followup: 'Follow-up added',
  disputed: 'Resolution disputed by citizen',
  reopened: 'Reopened',
  overdue: 'Marked overdue',
};

// Demo-only progression used by "Simulate next update".
const DEMO_NEXT: Partial<Record<ComplaintStatus, { stage: TimelineStage; status: ComplaintStatus; note: string }>> = {
  Submitted: { stage: 'acknowledged', status: 'Acknowledged', note: 'Simulated acknowledgement from the department.' },
  Acknowledged: { stage: 'assigned', status: 'In Progress', note: 'Simulated assignment to a field engineer.' },
  'In Progress': { stage: 'action', status: 'Action Reported', note: 'Simulated report that work was carried out.' },
  'Action Reported': { stage: 'resolved', status: 'Resolved', note: 'Simulated closure by the department. Not yet confirmed by the citizen.' },
  Reopened: { stage: 'action', status: 'Action Reported', note: 'Simulated report of further work after reopening.' },
};

function Milestones({ c }: { c: Complaint }) {
  return (
    <ol className="grid grid-cols-2 border-l border-t border-line sm:grid-cols-3 lg:grid-cols-6">
      {MILESTONES.map((m) => {
        const ev = [...c.timeline].reverse().find((e) => e.stage === m.stage || m.alt?.includes(e.stage));
        const disputed = ev?.stage === 'disputed';
        return (
          <li key={m.stage} className={`border-b border-r border-line px-3 py-3 ${ev ? 'bg-surface' : 'bg-canvas'}`}>
            <div className="flex items-center gap-1.5 text-xs font-medium">
              {ev ? (
                <Check size={13} className={disputed ? 'text-crit' : 'text-ok'} aria-hidden />
              ) : (
                <span className="inline-block h-3 w-3 border border-line" aria-hidden />
              )}
              {m.label}
            </div>
            <div className="mt-1 text-xs text-muted tnum">
              {ev ? (disputed ? `Disputed ${formatDate(ev.date)}` : formatDate(ev.date)) : 'Not yet recorded'}
            </div>
            {ev && <div className="mt-0.5"><SourceLabel source={ev.source} /></div>}
          </li>
        );
      })}
    </ol>
  );
}

function EventItem({ e, onRemove }: { e: TimelineEvent; onRemove?: () => void }) {
  const tone =
    e.stage === 'disputed' || e.stage === 'reopened' || e.stage === 'overdue'
      ? 'bg-crit'
      : e.stage === 'resolved' || e.stage === 'verification'
        ? 'bg-ok'
        : e.stage === 'followup'
          ? 'bg-muted'
          : 'bg-accent';
  return (
    <li className="relative grid grid-cols-[16px_1fr] gap-3 pb-5 last:pb-0">
      <span className={`mt-1.5 h-2.5 w-2.5 rounded-full ${tone}`} aria-hidden />
      <div>
        <div className="flex flex-wrap items-baseline gap-x-3">
          <span className="text-sm font-medium">{STAGE_LABEL[e.stage]}</span>
          <span className="text-xs text-muted tnum">{formatDateTime(e.date)}</span>
          <SourceLabel source={e.source} />
        </div>
        <p className="mt-0.5 text-sm leading-relaxed text-muted">{e.note}</p>
        {onRemove && (
          <button onClick={onRemove} className="mt-1 text-xs text-accent underline">
            Undo this update
          </button>
        )}
      </div>
    </li>
  );
}

export default function ComplaintDetailPage() {
  const { id } = useParams();
  const { complaints, dispatch } = useStore();
  const navigate = useNavigate();
  const c = complaints.find((x) => x.id === id);
  const [expanded, setExpanded] = useState(false);
  const [showText, setShowText] = useState(false);
  const [followup, setFollowup] = useState('');
  const [followupError, setFollowupError] = useState('');
  const [disputing, setDisputing] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeError, setDisputeError] = useState('');
  useGuideCheckpoint('detail');

  if (!c) {
    return (
      <div className="container-page py-10">
        <EmptyState title="Complaint not found">
          It may have been deleted or the demo data was reset. <Link to="/complaints" className="link">Back to My Complaints</Link>
        </EmptyState>
      </div>
    );
  }

  const loc = localityById(c.localityId);
  const dept = departmentById(c.departmentId);
  const svc = serviceById(c.serviceId);
  const events = [...c.timeline].reverse();
  const visible = expanded ? events : events.slice(0, 4);
  const resolvedish = c.status === 'Resolved' || c.status === 'Action Reported';
  const source = c.isDemo ? 'demo' : 'user';
  const demoNext = c.isDemo ? DEMO_NEXT[c.status] : undefined;

  const addFollowup = (e: React.FormEvent) => {
    e.preventDefault();
    if (followup.trim().length < 10) return setFollowupError('Write at least 10 characters.');
    dispatch({ type: 'event', id: c.id, stage: 'followup', note: followup.trim(), source });
    setFollowup('');
    setFollowupError('');
  };

  const dispute = (e: React.FormEvent) => {
    e.preventDefault();
    if (disputeReason.trim().length < 10) return setDisputeError('Explain briefly what is still wrong (at least 10 characters).');
    dispatch({ type: 'event', id: c.id, stage: 'disputed', note: disputeReason.trim(), source, status: 'Reopened', verification: 'disputed' });
    setDisputing(false);
    setDisputeReason('');
    setDisputeError('');
  };

  return (
    <div className="container-page py-6">
      <Link to="/complaints" className="tap inline-flex items-center gap-1 text-sm text-accent hover:underline">
        <ArrowLeft size={15} aria-hidden /> My complaints
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs text-muted tnum">{c.isDemo ? 'Demo reference' : 'Portal reference'} {c.ref}</div>
          <h1 className="mt-0.5 text-xl font-semibold sm:text-2xl">{c.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
            <StatusLabel status={c.status} />
            <span className="text-muted">Status source:</span> <SourceLabel source={c.statusSource} />
          </div>
        </div>
      </div>

      {c.isDemo && (
        <div className="mt-4">
          <Notice tone="warn" title="Demo record — not submitted to government">
            This record was created through the simulated demo path. All updates on it are simulated.
          </Notice>
        </div>
      )}

      <section className="mt-6" data-guide="complaint-timeline">
        <h2 className="section-title mb-3">Progress</h2>
        <Milestones c={c} />
        {c.status === 'Resolved' && c.citizenVerification !== 'confirmed' && (
          <p className="mt-2 text-xs text-muted">
            The department has marked this complaint resolved. That is not the same as a citizen confirming the problem is fixed.
          </p>
        )}
      </section>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section>
          <div className="flex items-baseline justify-between">
            <h2 className="section-title">Timeline</h2>
            <span className="text-xs text-muted">{events.length} updates, newest first</span>
          </div>
          <ol className="mt-4 border-l border-line pl-0">
            {visible.map((e) => (
              // Only the newest update can be undone, so status reverts in the right order.
              <EventItem key={e.id} e={e} onRemove={e.removable && e.id === events[0].id ? () => dispatch({ type: 'removeEvent', id: c.id, eventId: e.id }) : undefined} />
            ))}
          </ol>
          {events.length > 4 && (
            <button onClick={() => setExpanded((x) => !x)} className="btn-ghost mt-2 text-sm">
              {expanded ? 'Show fewer updates' : `Show all ${events.length} updates`}
            </button>
          )}

          <div className="mt-8 border-t border-line pt-5">
            <h3 className="font-medium">Add a follow-up</h3>
            <p className="text-xs text-muted">
              Record something you observed or a reminder you sent. It is saved as {c.isDemo ? 'a simulated demo update' : '“Reported by you”'}.
            </p>
            <form onSubmit={addFollowup} className="mt-2" noValidate>
              <label htmlFor="followup" className="sr-only">Follow-up note</label>
              <textarea
                id="followup"
                rows={3}
                className={`input ${followupError ? 'input-error' : ''}`}
                placeholder="e.g. Called the zonal office helpline; told the work is scheduled for next week."
                value={followup}
                onChange={(e) => { setFollowup(e.target.value); setFollowupError(''); }}
              />
              {followupError && <p className="error-text">{followupError}</p>}
              <button type="submit" className="btn-secondary mt-2">Add follow-up</button>
            </form>
          </div>
        </section>

        <aside className="space-y-5">
          <section className="panel">
            <h2 className="border-b border-line px-4 py-3 section-title">Citizen verification</h2>
            <div className="space-y-3 px-4 py-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-muted">Department status</span>
                <StatusLabel status={c.status} />
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted">Your verification</span>
                <VerificationLabel value={c.citizenVerification} />
              </div>
              {resolvedish && c.citizenVerification !== 'confirmed' && !disputing && (
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    className="btn-secondary"
                    onClick={() =>
                      dispatch({ type: 'event', id: c.id, stage: 'verification', note: 'Citizen confirmed that the problem has been fixed.', source, verification: 'confirmed' })
                    }
                  >
                    Confirm it is fixed
                  </button>
                  <button className="btn-danger" onClick={() => setDisputing(true)}>
                    Dispute the resolution
                  </button>
                </div>
              )}
              {disputing && (
                <form onSubmit={dispute} noValidate className="space-y-2 border-t border-line pt-3">
                  <label htmlFor="dispute" className="label">What is still wrong?</label>
                  <textarea
                    id="dispute"
                    rows={3}
                    className={`input ${disputeError ? 'input-error' : ''}`}
                    value={disputeReason}
                    onChange={(e) => { setDisputeReason(e.target.value); setDisputeError(''); }}
                  />
                  {disputeError && <p className="error-text">{disputeError}</p>}
                  <p className="hint">The complaint will show as Reopened, with the source marked as {c.isDemo ? 'simulated demo' : 'reported by you'}. You can undo this.</p>
                  <div className="flex gap-2">
                    <button type="submit" className="btn-danger">Record dispute</button>
                    <button type="button" className="btn-ghost" onClick={() => setDisputing(false)}>Cancel</button>
                  </div>
                </form>
              )}
              {!resolvedish && c.citizenVerification === 'not-requested' && (
                <p className="text-xs text-muted">Verification becomes available once the department reports action or resolution.</p>
              )}
            </div>
          </section>

          {c.isDemo && (
            <section className="border border-warn/50 bg-surface">
              <h2 className="border-b border-warn/40 bg-warn-tint px-4 py-3 font-semibold">Demo controls</h2>
              <div className="space-y-3 px-4 py-3 text-sm">
                {demoNext ? (
                  <button
                    className="btn-secondary w-full"
                    onClick={() => dispatch({ type: 'event', id: c.id, stage: demoNext.stage, note: demoNext.note, source: 'demo', status: demoNext.status, verification: demoNext.status === 'Resolved' ? 'pending' : undefined })}
                  >
                    Simulate next update: {demoNext.status}
                  </button>
                ) : (
                  <p className="text-xs text-muted">No further simulated department updates for this status.</p>
                )}
                <button
                  className="btn-danger w-full"
                  onClick={() => {
                    if (window.confirm('Delete this demo record from your browser?')) {
                      dispatch({ type: 'delete', id: c.id });
                      navigate('/complaints');
                    }
                  }}
                >
                  Delete demo record
                </button>
              </div>
            </section>
          )}

          <section className="panel">
            <h2 className="border-b border-line px-4 py-3 section-title">Details</h2>
            <dl className="divide-y divide-line text-sm">
              {[
                ['Category', categoryLabel(c.category)],
                ['Location', [c.landmark, loc?.name, c.city].filter(Boolean).join(', ')],
                ['Ward / PIN', `${c.ward} · ${c.pin}`],
                ['Department', dept?.name],
                ['Submitted', formatDate(c.submittedOn)],
                ['First noticed', formatDate(c.incidentDate)],
                ['Photo', c.hasPhoto ? 'Attached on portal' : 'None'],
              ].map(([k, v]) => (
                <div key={k} className="grid grid-cols-[110px_1fr] gap-3 px-4 py-2">
                  <dt className="text-muted">{k}</dt>
                  <dd className="tnum">{v}</dd>
                </div>
              ))}
              {svc && (
                <div className="grid grid-cols-[110px_1fr] gap-3 px-4 py-2">
                  <dt className="text-muted">Channel</dt>
                  <dd>
                    <PortalLink url={svc.url} status={svc.urlStatus}>{svc.name}</PortalLink>
                    <div><UrlStatusLabel status={svc.urlStatus} /></div>
                  </dd>
                </div>
              )}
            </dl>
            <div className="border-t border-line px-4 py-3">
              <button className="btn-ghost -ml-2 text-sm" onClick={() => setShowText((s) => !s)} aria-expanded={showText}>
                {showText ? 'Hide complaint text' : 'Show complaint text'}
              </button>
              {showText && <pre className="mt-2 whitespace-pre-wrap font-sans text-sm leading-relaxed">{c.complaintText}</pre>}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
