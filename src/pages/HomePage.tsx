import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useLang } from '../state/i18n';
import { useStore } from '../state/store';
import { QUICK_TOPICS } from '../lib/intent';
import { LOCALITIES, categoryLabel, localityById } from '../data/reference';
import { PUBLIC_RECORDS } from '../data/publicDataset';
import { areaGlance } from '../lib/metrics';
import { formatDate, formatNumber } from '../lib/format';
import { StatusLabel } from '../components/Status';
import { useGuide, useGuideCheckpoint } from '../state/guide';

export default function HomePage() {
  const { t, lang } = useLang();
  const { complaints } = useStore();
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [area, setArea] = useState('sec15');
  useGuideCheckpoint('home');
  const guide = useGuide();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim().length < 5) {
      setError(lang === 'hi' ? 'कृपया अपनी समस्या कुछ शब्दों में लिखें।' : 'Please describe the problem in a few words.');
      return;
    }
    navigate(`/assistant?q=${encodeURIComponent(text.trim())}`);
  };

  const recent = [...complaints].sort((a, b) => b.lastUpdate.localeCompare(a.lastUpdate)).slice(0, 4);
  const glance = areaGlance(PUBLIC_RECORDS, area);

  return (
    <div>
      <section className="border-b border-line bg-surface">
        <div className="container-page grid grid-cols-1 gap-10 py-10 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <h1 className="text-[28px] font-semibold leading-tight sm:text-[32px]">{t('home.title')}</h1>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted">{t('home.lead')}</p>

            {!guide.dismissed && !guide.active && (
              <div className="mt-5 flex flex-col gap-3 border-l-4 border-accent bg-accent-tint px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm">
                  <div className="font-semibold">{t('guide.bannerTitle')}</div>
                  <div className="text-ink/90">{t('guide.bannerBody')}</div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button className="btn-primary" onClick={guide.start}>{t('guide.start')}</button>
                  <button className="btn-ghost" onClick={guide.dismissBanner}>{t('guide.noThanks')}</button>
                </div>
              </div>
            )}

            <form onSubmit={submit} className="mt-6" data-guide="home-input">
              <label htmlFor="home-problem" className="sr-only">
                {t('home.placeholder')}
              </label>
              <textarea
                id="home-problem"
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  setError('');
                }}
                rows={3}
                placeholder={t('home.placeholder')}
                className={`input resize-y text-[15px] ${error ? 'input-error' : ''}`}
                aria-invalid={!!error}
              />
              {error && <p className="error-text">{error}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button type="submit" className="btn-primary">
                  {t('home.cta')} <ArrowRight size={16} aria-hidden />
                </button>
                <span className="text-xs text-muted">
                  {lang === 'hi' ? 'हिंदी या अंग्रेज़ी में लिखें। आधार नंबर या पासवर्ड न डालें।' : 'Write in English or Hindi. Do not enter Aadhaar numbers or passwords.'}
                </span>
              </div>
              {guide.dismissed && !guide.active && (
                <button type="button" onClick={guide.start} className="link tap mt-2 text-sm md:min-h-0">
                  {t('guide.link')}
                </button>
              )}
            </form>

            <div className="mt-8">
              <h2 className="eyebrow">{t('home.quick')}</h2>
              <div className="mt-2 grid grid-cols-2 border-l border-t border-line sm:grid-cols-3">
                {QUICK_TOPICS.map((q) => (
                  <Link
                    key={q.id}
                    to={`/assistant?q=${encodeURIComponent(q.prompt[lang])}`}
                    className="border-b border-r border-line px-3 py-3 text-sm hover:bg-accent-tint hover:text-accent"
                  >
                    {q.id === 'other' ? (lang === 'hi' ? 'अन्य सरकारी सेवाएँ' : 'Other public services') : categoryLabel(q.id, lang)}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <aside className="lg:border-l lg:border-line lg:pl-10">
            <div className="flex items-baseline justify-between">
              <h2 className="section-title">{t('home.recent')}</h2>
              <Link to="/complaints" className="link tap text-sm">
                {t('common.viewAll')}
              </Link>
            </div>
            {recent.length === 0 ? (
              <p className="mt-3 text-sm text-muted">No complaints yet. Start by describing a problem.</p>
            ) : (
              <ul className="mt-3 divide-y divide-line border-y border-line">
                {recent.map((c) => (
                  <li key={c.id}>
                    <Link to={`/complaints/${c.id}`} className="block py-3 hover:bg-canvas">
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-sm font-medium leading-snug">{c.title}</span>
                        <StatusLabel status={c.status} />
                      </div>
                      <div className="mt-1 text-xs text-muted tnum">
                        {c.ref} · {localityById(c.localityId)?.name} · updated {formatDate(c.lastUpdate)}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-6 text-sm">
              <div className="eyebrow">Also available</div>
              <ul className="mt-2 space-y-1.5">
                <li><Link to="/services" className="link tap">Browse official service portals</Link></li>
                <li><Link to="/authorities" className="link tap">Find the office responsible for your area</Link></li>
              </ul>
            </div>
          </aside>
        </div>
      </section>

      <section className="container-page py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="section-title">{t('home.area')}</h2>
            <p className="text-xs text-muted">
              Complaints received in the last 90 days of the sample dataset ({formatDate(glance.from)} – 28 Oct 2026). Sample data, not official statistics.
            </p>
          </div>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <label htmlFor="area" className="text-sm text-muted">Locality</label>
            <select id="area" className="input min-w-0 flex-1 sm:w-auto sm:flex-none" value={area} onChange={(e) => setArea(e.target.value)}>
              {LOCALITIES.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-2 border-l border-t border-line bg-surface md:grid-cols-4">
          {[
            { label: 'Complaints received', value: glance.total, note: `${glance.incidents} distinct incidents` },
            { label: 'Recorded as resolved', value: glance.resolved, note: `${glance.confirmed} confirmed by citizens` },
            { label: 'Awaiting action', value: glance.awaiting, note: `${glance.actionReported} more with action reported` },
            { label: 'Overdue', value: glance.overdue, note: 'past the sample service timeline', critical: true },
          ].map((m) => (
            <div key={m.label} className="border-b border-r border-line px-4 py-4">
              <dt className="text-xs text-muted">{m.label}</dt>
              <dd className={`mt-1 text-2xl font-semibold tnum ${m.critical && m.value > 0 ? 'text-crit' : ''}`}>{formatNumber(m.value)}</dd>
              <dd className="text-xs text-muted">{m.note}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-3 text-sm">
          <Link to={`/public-dashboard?locality=${area}`} className="link inline-flex items-center gap-1">
            Open the public accountability dashboard for {localityById(area)?.name} <ArrowRight size={14} aria-hidden />
          </Link>
        </div>
      </section>
    </div>
  );
}
