import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown } from 'lucide-react';
import { useLang, type StringKey } from '../state/i18n';
import GuidePanel from './GuidePanel';
import { useStartGuide } from '../state/guide';

const NAV: { to: string; key: StringKey }[] = [
  { to: '/', key: 'nav.home' },
  { to: '/assistant', key: 'nav.report' },
  { to: '/complaints', key: 'nav.complaints' },
  { to: '/public-dashboard', key: 'nav.dashboard' },
  { to: '/services', key: 'nav.services' },
];

function LanguageSwitch() {
  const { lang, setLang } = useLang();
  return (
    <div className="flex overflow-hidden rounded border border-line text-xs" role="group" aria-label="Language">
      {(['en', 'hi'] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`tap px-3 py-2 lg:py-1.5 ${lang === l ? 'bg-accent text-white' : 'bg-surface text-ink hover:bg-accent-tint'}`}
        >
          {l === 'en' ? 'English' : 'हिंदी'}
        </button>
      ))}
    </div>
  );
}

function AccountMenu() {
  const { t } = useLang();
  const startGuide = useStartGuide();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded border border-line px-2 py-1 text-sm hover:border-accent"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-sm bg-accent-tint text-xs font-semibold text-accent">DC</span>
        <ChevronDown size={14} className="text-muted" aria-hidden />
        <span className="sr-only">Account menu</span>
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-1 w-60 border border-line bg-surface py-1 text-sm shadow-sm">
          <div className="border-b border-line px-3 py-2">
            <div className="font-medium">Demo citizen</div>
            <div className="text-xs text-muted">Sample profile · Sector 15, Faridabad</div>
          </div>
          <Link to="/complaints" onClick={() => setOpen(false)} className="block px-3 py-2 hover:bg-canvas">
            {t('nav.complaints')}
          </Link>
          <button
            onClick={() => {
              setOpen(false);
              startGuide();
            }}
            className="block w-full px-3 py-2 text-left hover:bg-canvas"
          >
            {t('guide.name')}
          </button>
          <Link to="/privacy" onClick={() => setOpen(false)} className="block px-3 py-2 hover:bg-canvas">
            {t('nav.privacy')}
          </Link>
          <Link to="/demo" onClick={() => setOpen(false)} className="block px-3 py-2 hover:bg-canvas">
            {t('nav.demo')}
          </Link>
        </div>
      )}
    </div>
  );
}

export default function Layout() {
  const { t } = useLang();
  const startGuide = useStartGuide();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => {
    setMobileOpen(false);
    window.scrollTo(0, 0);
  }, [pathname]);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `border-b-2 px-1 py-4 text-sm transition-colors ${
      isActive ? 'border-accent font-medium text-accent' : 'border-transparent text-ink hover:text-accent'
    }`;

  return (
    <div className="flex min-h-screen flex-col">
      <div className="border-b border-line bg-[#EEF1F4] text-xs text-muted">
        <div className="container-page flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-1.5">
          <span>{t('disclaimer')}</span>
          <Link to="/privacy" className="link tap md:min-h-0">
            {t('nav.privacy')}
          </Link>
        </div>
      </div>
      <header className="sticky top-0 z-20 border-b border-line bg-surface">
        <div className="container-page flex items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <Link to="/" className="py-3 text-[17px] font-semibold tracking-tight text-ink">
              JanSeva <span className="text-accent">AI</span>
            </Link>
            <nav className="hidden items-center gap-5 lg:flex" aria-label="Main">
              {NAV.map((n) => (
                <NavLink key={n.to} to={n.to} end={n.to === '/'} className={linkClass}>
                  {t(n.key)}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="hidden items-center gap-3 lg:flex">
            <LanguageSwitch />
            <AccountMenu />
          </div>
          <button
            className="rounded border border-line p-2.5 lg:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
        {mobileOpen && (
          <div className="border-t border-line bg-surface lg:hidden">
            <nav className="container-page flex flex-col py-2" aria-label="Main mobile">
              {[...NAV, { to: '/authorities', key: 'nav.authorities' as StringKey }, { to: '/demo', key: 'nav.demo' as StringKey }].map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  end={n.to === '/'}
                  className={({ isActive }) =>
                    `border-l-2 px-3 py-2.5 text-sm ${isActive ? 'border-accent bg-accent-tint font-medium text-accent' : 'border-transparent'}`
                  }
                >
                  {t(n.key)}
                </NavLink>
              ))}
              <button onClick={startGuide} className="border-l-2 border-transparent px-3 py-2.5 text-left text-sm text-accent">
                {t('guide.name')}
              </button>
              <div className="mt-2 border-t border-line px-3 pt-3">
                <LanguageSwitch />
              </div>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>
      <GuidePanel />

      <footer className="mt-16 border-t border-line bg-surface">
        <div className="container-page grid grid-cols-1 gap-6 py-8 text-sm sm:grid-cols-3">
          <div>
            <div className="font-semibold">JanSeva AI</div>
            <p className="mt-1 max-w-xs text-xs text-muted">
              Hackathon prototype. Independent of any government body. Does not submit complaints on your behalf.
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Link to="/authorities" className="link tap w-fit">{t('nav.authorities')}</Link>
            <Link to="/services" className="link tap w-fit">{t('nav.services')}</Link>
            <Link to="/public-dashboard" className="link tap w-fit">{t('nav.dashboard')}</Link>
          </div>
          <div className="flex flex-col gap-1.5">
            <button onClick={startGuide} className="link tap w-fit text-left">{t('guide.name')}</button>
            <Link to="/privacy" className="link tap w-fit">Privacy notice</Link>
            <Link to="/demo" className="link tap w-fit">Demo settings and reset</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
