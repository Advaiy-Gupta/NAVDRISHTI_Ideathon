import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../state/i18n';
import { EMPTY_DRAFT, useStore } from '../state/store';
import type { Complaint, ComplaintDraft } from '../data/types';
import { validateDraft, type Errors } from '../lib/validation';
import ComplaintForm from '../components/complaint/ComplaintForm';
import ComplaintReview from '../components/complaint/ComplaintReview';
import SubmissionGuidance from '../components/complaint/SubmissionGuidance';
import { Notice } from '../components/ui';
import { StepIndicator } from '../components/complaint/StepIndicator';
import { useGuideCheckpoint } from '../state/guide';

type Step = 'edit' | 'review' | 'guidance' | 'done';

export default function NewComplaintPage() {
  const { lang } = useLang();
  const { draft, dispatch } = useStore();
  const [step, setStep] = useState<Step>('edit');
  const [errors, setErrors] = useState<Errors>({});
  const [created, setCreated] = useState<Complaint | null>(null);
  const fromAssistant = !!draft.category;
  useGuideCheckpoint(step === 'edit' ? 'form-edit' : step === 'review' ? 'form-review' : step === 'guidance' ? 'form-guidance' : 'done');

  const update = (patch: Partial<ComplaintDraft>) => {
    dispatch({ type: 'draft', draft: { ...draft, ...patch } });
    const cleared = { ...errors };
    (Object.keys(patch) as (keyof ComplaintDraft)[]).forEach((k) => delete cleared[k]);
    setErrors(cleared);
  };

  const toReview = () => {
    const e = validateDraft(draft);
    setErrors(e);
    if (Object.keys(e).length) {
      const first = Object.keys(e)[0];
      window.setTimeout(() => document.getElementById(`f-${first}`)?.focus(), 0);
      return;
    }
    setStep('review');
    window.scrollTo(0, 0);
  };

  const onCreated = (c: Complaint) => {
    dispatch({ type: 'add', complaint: c });
    dispatch({ type: 'draft', draft: EMPTY_DRAFT });
    setCreated(c);
    setStep('done');
    window.scrollTo(0, 0);
  };

  return (
    <div className="container-page py-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{lang === 'hi' ? 'शिकायत की समीक्षा और जमा करने के निर्देश' : 'Review complaint and submission guidance'}</h1>
          <p className="mt-1 text-sm text-muted">
            JanSeva prepares your complaint. You submit it yourself on the official channel.
          </p>
        </div>
        {step !== 'done' && <StepIndicator current={step === 'edit' ? 0 : step === 'review' ? 1 : 2} />}
      </div>

      {step === 'edit' && (
        <>
          {!fromAssistant && (
            <div className="mb-5">
              <Notice title="Starting without the assistant">
                You can fill in the form directly, or <Link to="/assistant" className="link">describe the problem to the assistant</Link> to have the category, department and channel suggested for you.
              </Notice>
            </div>
          )}
          <ComplaintForm draft={draft} errors={errors} onChange={update} onSubmit={toReview} />
        </>
      )}

      {step === 'review' && (
        <ComplaintReview draft={draft} onEdit={() => setStep('edit')} onConfirm={() => { setStep('guidance'); window.scrollTo(0, 0); }} />
      )}

      {step === 'guidance' && <SubmissionGuidance draft={draft} onBack={() => setStep('review')} onCreated={onCreated} />}

      {step === 'done' && created && (
        <div className="max-w-2xl">
          {created.isDemo ? (
            <Notice tone="warn" title="Demo record — not submitted to government">
              This simulated record exists only in your browser. No complaint has been sent to any department or portal, and the reference number below is fictional.
            </Notice>
          ) : (
            <Notice tone="ok" title="Reference number recorded">
              JanSeva will track this complaint using the reference number you entered. Status updates you add are marked as reported by you until they can be confirmed from the official portal.
            </Notice>
          )}
          <dl className="panel mt-5 divide-y divide-line text-sm">
            <div className="grid grid-cols-[160px_1fr] gap-3 px-4 py-3">
              <dt className="text-muted">{created.isDemo ? 'Demo reference' : 'Portal reference'}</dt>
              <dd className="font-semibold tnum">{created.ref}</dd>
            </div>
            <div className="grid grid-cols-[160px_1fr] gap-3 px-4 py-3">
              <dt className="text-muted">Complaint</dt>
              <dd>{created.title}</dd>
            </div>
            <div className="grid grid-cols-[160px_1fr] gap-3 px-4 py-3">
              <dt className="text-muted">Current status</dt>
              <dd>Submitted ({created.isDemo ? 'simulated' : 'reported by you'})</dd>
            </div>
          </dl>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to={`/complaints/${created.id}`} className="btn-primary" data-guide="complaint-timeline">View complaint timeline</Link>
            <Link to="/complaints" className="btn-secondary">Go to My Complaints</Link>
            <Link to="/assistant" className="btn-ghost">Report another issue</Link>
          </div>
        </div>
      )}
    </div>
  );
}
