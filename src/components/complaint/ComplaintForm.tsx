import { useRef, useState } from 'react';
import { ImagePlus } from 'lucide-react';
import type { CategoryId, ComplaintDraft } from '../../data/types';
import { CATEGORIES, CITIES, DEPARTMENTS, LOCALITIES, STATES, localityById, resolveJurisdiction } from '../../data/reference';
import { SERVICES, serviceById } from '../../data/directory';
import { buildComplaintText } from '../../lib/intent';
import type { Errors } from '../../lib/validation';
import { useLang } from '../../state/i18n';
import { Field, UrlStatusLabel } from '../ui';

export default function ComplaintForm({
  draft: d,
  errors,
  onChange,
  onSubmit,
}: {
  draft: ComplaintDraft;
  errors: Errors;
  onChange: (p: Partial<ComplaintDraft>) => void;
  onSubmit: () => void;
}) {
  const { lang } = useLang();
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoError, setPhotoError] = useState('');
  const today = new Date().toISOString().slice(0, 10);
  const cls = (k: keyof ComplaintDraft) => `input ${errors[k] ? 'input-error' : ''}`;
  const aria = (k: keyof ComplaintDraft) => ({
    id: `f-${k}`,
    'aria-invalid': !!errors[k],
    'aria-describedby': errors[k] ? `f-${k}-error` : undefined,
  });

  // Category or locality changes re-run the sample jurisdiction rules.
  const reroute = (category: CategoryId | '', localityId: string): Partial<ComplaintDraft> => {
    if (!category || !localityId) return {};
    const j = resolveJurisdiction(category, localityId);
    return { departmentId: j.departmentId, serviceId: j.serviceId };
  };

  const onPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (!f.type.startsWith('image/')) return setPhotoError('Please choose an image file (JPG or PNG).');
    if (f.size > 5 * 1024 * 1024) return setPhotoError('The image is larger than 5 MB.');
    setPhotoError('');
    onChange({ photoUrl: URL.createObjectURL(f), photoName: f.name });
  };

  const svc = serviceById(d.serviceId);
  const suggested = d.category && d.localityId ? resolveJurisdiction(d.category, d.localityId) : null;
  const errorCount = Object.keys(errors).length;

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_340px]"
    >
      <div className="space-y-8">
        {errorCount > 0 && (
          <div className="border-l-4 border-crit bg-crit-tint px-4 py-3 text-sm" role="alert">
            <span className="font-semibold">
              {errorCount} {errorCount === 1 ? 'field needs' : 'fields need'} attention.
            </span>{' '}
            Check the highlighted fields below.
          </div>
        )}

        <fieldset className="space-y-4">
          <legend className="section-title mb-3">The problem</legend>
          <Field label="Complaint title" htmlFor="f-title" error={errors.title} hint="A short, specific summary. Example: Deep pothole on Sector 15 market road.">
            <input {...aria('title')} className={cls('title')} value={d.title} onChange={(e) => onChange({ title: e.target.value })} />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Category" htmlFor="f-category" error={errors.category}>
              <select
                {...aria('category')}
                className={cls('category')}
                value={d.category}
                onChange={(e) => {
                  const category = e.target.value as CategoryId | '';
                  onChange({ category, ...reroute(category, d.localityId) });
                }}
              >
                <option value="">Choose…</option>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Date first noticed" htmlFor="f-incidentDate" error={errors.incidentDate}>
              <input type="date" max={today} {...aria('incidentDate')} className={cls('incidentDate')} value={d.incidentDate} onChange={(e) => onChange({ incidentDate: e.target.value })} />
            </Field>
          </div>
          <Field label="Description" htmlFor="f-description" error={errors.description} hint="What is the problem, how long has it existed, and who is affected? Do not include Aadhaar or bank details.">
            <textarea {...aria('description')} rows={4} className={`${cls('description')} leading-relaxed`} value={d.description} onChange={(e) => onChange({ description: e.target.value })} />
          </Field>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="section-title mb-3">Location</legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="State" htmlFor="f-state" error={errors.state}>
              <select {...aria('state')} className={cls('state')} value={d.state} onChange={(e) => onChange({ state: e.target.value, city: CITIES[e.target.value]?.[0] ?? '' })}>
                {STATES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="City" htmlFor="f-city" error={errors.city}>
              <select {...aria('city')} className={cls('city')} value={d.city} onChange={(e) => onChange({ city: e.target.value })}>
                {(CITIES[d.state] ?? []).map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Locality" htmlFor="f-localityId" error={errors.localityId} hint={d.city !== 'Faridabad' ? 'The demo directory only covers Faridabad.' : undefined}>
              <select
                {...aria('localityId')}
                className={cls('localityId')}
                value={d.localityId}
                onChange={(e) => {
                  const l = localityById(e.target.value);
                  onChange({ localityId: e.target.value, ward: l?.ward ?? '', pin: l?.pin ?? '', ...reroute(d.category, e.target.value) });
                }}
              >
                <option value="">Choose…</option>
                {LOCALITIES.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Ward" htmlFor="f-ward" optional>
              <input {...aria('ward')} className={cls('ward')} value={d.ward} onChange={(e) => onChange({ ward: e.target.value })} />
            </Field>
            <Field label="PIN code" htmlFor="f-pin" error={errors.pin}>
              <input {...aria('pin')} inputMode="numeric" maxLength={6} className={`${cls('pin')} tnum`} value={d.pin} onChange={(e) => onChange({ pin: e.target.value.replace(/\D/g, '') })} />
            </Field>
            <Field label="Coordinates" htmlFor="f-coordinates" optional error={errors.coordinates} hint="latitude, longitude">
              <input {...aria('coordinates')} placeholder="28.3936, 77.3178" className={`${cls('coordinates')} tnum`} value={d.coordinates} onChange={(e) => onChange({ coordinates: e.target.value })} />
            </Field>
          </div>
          <Field label="Nearest landmark" htmlFor="f-landmark" optional hint="A shop, gate, pole number or house number helps the field team.">
            <input {...aria('landmark')} className={cls('landmark')} value={d.landmark} onChange={(e) => onChange({ landmark: e.target.value })} />
          </Field>
        </fieldset>

        <fieldset>
          <legend className="section-title mb-3">Evidence</legend>
          <div className="flex flex-wrap items-start gap-4">
            {d.photoUrl ? (
              <img src={d.photoUrl} alt="Selected evidence preview" className="h-28 w-40 border border-line object-cover" />
            ) : (
              <div className="flex h-28 w-40 items-center justify-center border border-dashed border-line text-xs text-muted">No photo</div>
            )}
            <div className="text-sm">
              <button type="button" onClick={() => fileRef.current?.click()} className="btn-secondary">
                <ImagePlus size={16} aria-hidden /> {d.photoUrl ? 'Replace photo' : 'Choose a photo'}
              </button>
              {d.photoUrl && (
                <button type="button" className="btn-ghost ml-2" onClick={() => onChange({ photoUrl: '', photoName: '' })}>
                  Remove
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPhoto} />
              <p className="hint max-w-sm">
                {d.photoName && !d.photoUrl
                  ? `“${d.photoName}” was selected earlier but previews are not kept after a page reload. Choose it again if needed.`
                  : 'JPG or PNG up to 5 MB. The photo stays in your browser; this prototype does not upload it anywhere.'}
              </p>
              {d.photoUrl && <p className="mt-1 text-xs">{d.photoName}</p>}
              {photoError && <p className="error-text">{photoError}</p>}
            </div>
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="section-title mb-3">Complaint text</legend>
          <Field label="Text to submit on the official channel" htmlFor="f-complaintText" error={errors.complaintText} hint="Edit freely. This is what you will paste into the official portal.">
            <textarea {...aria('complaintText')} rows={12} className={`${cls('complaintText')} font-[inherit] leading-relaxed`} value={d.complaintText} onChange={(e) => onChange({ complaintText: e.target.value })} />
          </Field>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-secondary text-xs" onClick={() => onChange({ complaintText: buildComplaintText(d, 'en') })}>
              Regenerate in English from the fields above
            </button>
            <button type="button" className="btn-secondary text-xs" onClick={() => onChange({ complaintText: buildComplaintText(d, 'hi') })}>
              हिंदी में बनाएँ
            </button>
          </div>
          {lang === 'hi' && <p className="hint">फ़ॉर्म के लेबल अंग्रेज़ी में हैं; शिकायत का पाठ हिंदी में बनाया जा सकता है।</p>}
        </fieldset>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <div className="panel p-4">
          <h2 className="section-title">Where this goes</h2>
          <div className="mt-3 space-y-3">
            <Field label="Suggested department" htmlFor="f-departmentId" error={errors.departmentId}>
              <select {...aria('departmentId')} className={cls('departmentId')} value={d.departmentId} onChange={(e) => onChange({ departmentId: e.target.value })}>
                <option value="">Choose…</option>
                {DEPARTMENTS.map((x) => <option key={x.id} value={x.id}>{x.shortName}</option>)}
              </select>
            </Field>
            <Field label="Suggested official channel" htmlFor="f-serviceId" error={errors.serviceId}>
              <select {...aria('serviceId')} className={cls('serviceId')} value={d.serviceId} onChange={(e) => onChange({ serviceId: e.target.value })}>
                <option value="">Choose…</option>
                {SERVICES.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            {svc && (
              <div className="text-xs">
                <UrlStatusLabel status={svc.urlStatus} /> <span className="text-muted">· {svc.verificationNote}</span>
              </div>
            )}
            {suggested && (
              <p className="border-t border-line pt-3 text-xs leading-relaxed text-muted">
                <span className="font-medium text-ink">Why this department: </span>
                {suggested.reason}
                {(suggested.departmentId !== d.departmentId || suggested.serviceId !== d.serviceId) && (
                  <>
                    {' '}
                    <button type="button" className="link" onClick={() => onChange({ departmentId: suggested.departmentId, serviceId: suggested.serviceId })}>
                      Restore suggestion
                    </button>
                  </>
                )}
              </p>
            )}
          </div>
        </div>
        <button type="submit" className="btn-primary w-full" data-guide="form-continue">Continue to review</button>
        <p className="text-xs text-muted">Nothing is submitted at this step.</p>
      </aside>
    </form>
  );
}
