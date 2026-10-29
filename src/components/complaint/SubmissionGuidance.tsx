import { useState } from 'react';
import { Copy } from 'lucide-react';
import type { Complaint, ComplaintDraft, StatusSource } from '../../data/types';
import { serviceById } from '../../data/directory';
import { validateRef } from '../../lib/validation';
import { Notice, PortalLink, UrlStatusLabel } from '../ui';

function makeComplaint(d: ComplaintDraft, ref: string, source: StatusSource): Complaint {
  const now = new Date().toISOString();
  const id = `${source === 'demo' ? 'd' : 'u'}${Date.now()}`;
  return {
    id,
    ref,
    title: d.title,
    category: d.category || 'other',
    description: d.description,
    complaintText: d.complaintText,
    state: d.state,
    city: d.city,
    localityId: d.localityId,
    ward: d.ward,
    pin: d.pin,
    landmark: d.landmark,
    coordinates: d.coordinates || undefined,
    incidentDate: d.incidentDate,
    departmentId: d.departmentId,
    serviceId: d.serviceId,
    submittedOn: now,
    lastUpdate: now,
    status: 'Submitted',
    statusSource: source,
    citizenVerification: 'not-requested',
    hasPhoto: !!d.photoName,
    isDemo: source === 'demo',
    timeline: [
      { id: `${id}-p`, stage: 'prepared', date: now, note: 'Complaint prepared and reviewed with JanSeva.', source: 'user' },
      {
        id: `${id}-s`,
        stage: 'submitted',
        date: now,
        note:
          source === 'demo'
            ? 'Simulated submission for the demo. Nothing was sent to any government system.'
            : 'Citizen recorded the reference number issued by the official portal.',
        source,
      },
    ],
  };
}

function demoRef() {
  const n = Math.floor(10000 + Math.random() * 89999);
  return `JSV-DEMO-2026-${n}`;
}

export default function SubmissionGuidance({
  draft,
  onBack,
  onCreated,
}: {
  draft: ComplaintDraft;
  onBack: () => void;
  onCreated: (c: Complaint) => void;
}) {
  const svc = serviceById(draft.serviceId);
  const [copied, setCopied] = useState(false);
  const [ref, setRef] = useState('');
  const [refError, setRefError] = useState('');
  const [creating, setCreating] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(draft.complaintText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  const recordReal = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateRef(ref);
    setRefError(err);
    if (!err) onCreated(makeComplaint(draft, ref.trim().toUpperCase(), 'user'));
  };

  const createDemo = () => {
    setCreating(true);
    window.setTimeout(() => onCreated(makeComplaint(draft, demoRef(), 'demo')), 600);
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <section>
        <Notice title="JanSeva does not submit complaints to the government">
          Submit the prepared complaint yourself on the official channel. JanSeva then helps you keep track of it using the reference number the portal gives you.
        </Notice>

        <ol className="mt-6 space-y-6" data-guide="submit-options">
          <li className="grid grid-cols-[28px_1fr] gap-3">
            <span className="text-sm font-semibold text-accent tnum">1.</span>
            <div>
              <h3 className="font-medium">Copy the complaint text</h3>
              <p className="mt-0.5 text-sm text-muted">You will paste it into the description field of the official form.</p>
              <button onClick={copy} className="btn-secondary mt-2">
                <Copy size={15} aria-hidden /> {copied ? 'Copied to clipboard' : 'Copy complaint text'}
              </button>
            </div>
          </li>
          <li className="grid grid-cols-[28px_1fr] gap-3">
            <span className="text-sm font-semibold text-accent tnum">2.</span>
            <div>
              <h3 className="font-medium">Open the official channel</h3>
              {svc && (
                <div className="mt-1 text-sm">
                  <div>{svc.name}</div>
                  <div className="text-xs text-muted">{svc.department} · {svc.submissionMethod}</div>
                  <div className="mt-1"><UrlStatusLabel status={svc.urlStatus} /> <span className="text-xs text-muted">· {svc.verificationNote}</span></div>
                  <PortalLink url={svc.url} status={svc.urlStatus} className="btn-primary mt-3">
                    Continue to official portal
                  </PortalLink>
                </div>
              )}
            </div>
          </li>
          <li className="grid grid-cols-[28px_1fr] gap-3">
            <span className="text-sm font-semibold text-accent tnum">3.</span>
            <div>
              <h3 className="font-medium">Attach evidence and provide contact details on the portal</h3>
              <p className="mt-0.5 text-sm text-muted">
                {svc?.requirements.join('; ')}. Your contact details go to the portal only; JanSeva never shows them publicly.
              </p>
            </div>
          </li>
          <li className="grid grid-cols-[28px_1fr] gap-3">
            <span className="text-sm font-semibold text-accent tnum">4.</span>
            <div className="w-full">
              <h3 className="font-medium">Record the reference number</h3>
              <form onSubmit={recordReal} className="mt-2 flex flex-wrap items-start gap-2" noValidate>
                <div className="min-w-[220px] flex-1">
                  <label htmlFor="portal-ref" className="sr-only">Portal reference number</label>
                  <input
                    id="portal-ref"
                    className={`input tnum ${refError ? 'input-error' : ''}`}
                    placeholder="Reference number from the portal"
                    value={ref}
                    onChange={(e) => { setRef(e.target.value); setRefError(''); }}
                    aria-invalid={!!refError}
                  />
                  {refError && <p className="error-text">{refError}</p>}
                </div>
                <button type="submit" className="btn-secondary">Save and track</button>
              </form>
              <p className="hint">Status updates for this record will be marked “Reported by you”.</p>
            </div>
          </li>
        </ol>
        <button onClick={onBack} className="btn-ghost mt-6">Back to review</button>
      </section>

      <aside className="self-start border border-warn/50 bg-surface">
        <div className="border-b border-warn/40 bg-warn-tint px-4 py-3">
          <h2 className="font-semibold">Demo path for judges</h2>
        </div>
        <div className="space-y-3 px-4 py-4 text-sm">
          <p>
            Create a simulated record to see how tracking works without visiting a government portal. The record gets a fictional reference number and is stored only in this browser.
          </p>
          <p className="text-muted">It will be clearly labelled “Simulated demo” everywhere it appears, and can be deleted from My Complaints or reset from Demo settings.</p>
          <button onClick={createDemo} disabled={creating} className="btn-primary w-full">
            {creating ? 'Creating demo record…' : 'Create simulated demo record'}
          </button>
        </div>
      </aside>
    </div>
  );
}
