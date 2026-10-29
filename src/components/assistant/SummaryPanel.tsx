import { Check } from 'lucide-react';
import type { AssistantDraft } from '../../lib/assistantEngine';
import { CATEGORIES, LOCALITIES, departmentById, localityById, resolveJurisdiction } from '../../data/reference';
import { serviceById } from '../../data/directory';
import { useLang } from '../../state/i18n';
import { PortalLink, UrlStatusLabel } from '../ui';
import type { CategoryId } from '../../data/types';
import { formatDate } from '../../lib/format';

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-3 border-b border-line py-2.5 text-sm last:border-b-0">
      <div className="text-muted">{label}</div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export default function SummaryPanel({
  draft,
  onEdit,
  onReview,
  onAttach,
}: {
  draft: AssistantDraft;
  onEdit: (p: Partial<AssistantDraft>) => void;
  onReview: () => void;
  onAttach: () => void;
}) {
  const { t, lang } = useLang();
  const hi = lang === 'hi';
  const loc = localityById(draft.localityId);
  const j = draft.category && draft.localityId ? resolveJurisdiction(draft.category, draft.localityId) : null;
  const dept = j ? departmentById(j.departmentId) : null;
  const svc = j ? serviceById(j.serviceId) : null;
  const ready = !!draft.category && !!draft.localityId;

  const checklist = [
    { label: hi ? 'समस्या का प्रकार' : 'Type of issue', done: !!draft.category, required: true },
    { label: hi ? 'इलाका' : 'Locality', done: !!draft.localityId, required: true },
    { label: hi ? 'निश्चित स्थान' : 'Precise landmark', done: !!draft.landmark, required: false },
    { label: hi ? 'फोटो' : 'Photo', done: !!draft.photoUrl, required: false },
    { label: hi ? 'कब देखा गया' : 'Date noticed', done: !!draft.incidentDate, required: false },
  ];

  return (
    <aside className="panel self-start" aria-label={t('assistant.summary')}>
      <div className="border-b border-line px-5 py-3">
        <h2 className="section-title">{t('assistant.summary')}</h2>
        <p className="text-xs text-muted">
          {hi ? 'बातचीत के साथ अपडेट होता है। आप यहाँ सीधे बदलाव कर सकते हैं।' : 'Updates as you talk. You can correct anything here directly.'}
        </p>
      </div>

      <div className="px-5 py-2">
        <Row label={hi ? 'श्रेणी' : 'Category'}>
          <select
            aria-label="Category"
            className="input py-1"
            value={draft.category ?? ''}
            onChange={(e) => onEdit({ category: (e.target.value || null) as CategoryId | null, categoryManual: true, matched: [], runnerUp: null })}
          >
            <option value="">{hi ? 'अभी तय नहीं' : 'Not identified yet'}</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{hi ? c.labelHi : c.label}</option>
            ))}
          </select>
          {draft.category && (
            <p className="mt-1 text-xs text-muted">
              {draft.categoryManual
                ? hi ? 'आपके द्वारा चुना गया।' : 'Selected by you.'
                : draft.matched.length
                  ? `${hi ? 'मिलान किए गए शब्द' : 'Matched terms'}: ${draft.matched.join(', ')}`
                  : hi ? 'कोई कीवर्ड नहीं मिला; सामान्य श्रेणी।' : 'No keywords matched; general category.'}
            </p>
          )}
        </Row>
        <Row label={hi ? 'इलाका' : 'Locality'}>
          <select
            aria-label="Locality"
            className="input py-1"
            value={draft.localityId}
            onChange={(e) => onEdit({ localityId: e.target.value, pin: '' })}
          >
            <option value="">{hi ? 'अभी तय नहीं' : 'Not identified yet'}</option>
            {LOCALITIES.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
          {loc && (
            <p className="mt-1 text-xs text-muted tnum">
              {loc.city}, {loc.state} · PIN {draft.pin || loc.pin} · {loc.ward}
            </p>
          )}
        </Row>
        <Row label={hi ? 'निश्चित स्थान' : 'Landmark'}>
          <input
            aria-label="Landmark"
            className="input py-1"
            value={draft.landmark}
            placeholder={hi ? 'जैसे: मार्केट गेट के सामने' : 'e.g. opposite the market gate'}
            onChange={(e) => onEdit({ landmark: e.target.value, landmarkConfirmed: true })}
          />
        </Row>
        <Row label={hi ? 'विवरण' : 'Description'}>
          {draft.description.length ? (
            <p className="leading-relaxed">{draft.description.join(' ')}</p>
          ) : (
            <span className="text-muted">{hi ? 'अभी कोई विवरण नहीं' : 'Nothing yet'}</span>
          )}
        </Row>
        <Row label={hi ? 'साक्ष्य' : 'Evidence'}>
          {draft.photoUrl ? (
            <div className="flex items-center gap-3">
              <img src={draft.photoUrl} alt="Attached evidence preview" className="h-14 w-20 border border-line object-cover" />
              <div className="min-w-0 text-xs">
                <div className="truncate">{draft.photoName}</div>
                <button className="link" onClick={() => onEdit({ photoUrl: '', photoName: '', photoSkipped: false })}>
                  {hi ? 'हटाएँ' : 'Remove'}
                </button>
              </div>
            </div>
          ) : (
            <button className="link text-sm" onClick={onAttach}>
              {hi ? 'फोटो जोड़ें' : 'Attach a photo'}
            </button>
          )}
        </Row>
        {draft.incidentDate && <Row label={hi ? 'पहली बार देखा' : 'First noticed'}>{formatDate(draft.incidentDate)}</Row>}
      </div>

      <div className="border-t border-line bg-canvas px-5 py-4">
        <h3 className="eyebrow">{hi ? 'ज़िम्मेदार विभाग और माध्यम' : 'Responsible authority and channel'}</h3>
        {j && dept && svc ? (
          <div className="mt-2 space-y-2 text-sm">
            <div>
              <div className="font-medium">{dept.name}</div>
              <div className="text-xs text-muted">{dept.parent}</div>
            </div>
            <p className="text-xs leading-relaxed text-muted">
              <span className="font-medium text-ink">{hi ? 'क्यों: ' : 'Why: '}</span>
              {j.reason}
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <PortalLink url={svc.url} status={svc.urlStatus}>{svc.name}</PortalLink>
              <UrlStatusLabel status={svc.urlStatus} />
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted">
            {hi ? 'श्रेणी और इलाका पता चलने पर विभाग सुझाया जाएगा।' : 'Shown once the type of issue and the locality are known.'}
          </p>
        )}
      </div>

      <div className="border-t border-line px-5 py-4">
        <h3 className="eyebrow">{hi ? 'जानकारी की जाँच-सूची' : 'Information checklist'}</h3>
        <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          {checklist.map((c) => (
            <li key={c.label} className={`flex items-center gap-1.5 ${c.done ? 'text-ink' : 'text-muted'}`}>
              {c.done ? <Check size={14} className="text-ok" aria-label="Done" /> : <span className="inline-block h-3.5 w-3.5 border border-line" aria-label="Missing" />}
              {c.label}
              {!c.required && !c.done && <span className="text-xs">({hi ? 'वैकल्पिक' : 'optional'})</span>}
            </li>
          ))}
        </ul>
        <button className="btn-primary mt-4 w-full" disabled={!ready} onClick={onReview} data-guide="assistant-review">
          {t('assistant.review')}
        </button>
        {!ready && (
          <p className="hint text-center">
            {hi ? 'समीक्षा के लिए श्रेणी और इलाका आवश्यक हैं।' : 'Category and locality are needed before review.'}
          </p>
        )}
      </div>
    </aside>
  );
}
