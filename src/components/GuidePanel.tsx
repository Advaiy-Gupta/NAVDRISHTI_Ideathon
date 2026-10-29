import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { CHECKPOINT_STEP, useGuide } from '../state/guide';
import { useLang } from '../state/i18n';
import { EXAMPLE_PROMPTS } from '../lib/intent';

interface Step {
  title: { en: string; hi: string };
  body: { en: string; hi: string };
  /** data-guide attribute of the element to highlight. */
  target?: string;
  /** Where to go to resume this step. */
  path: string;
}

const STEPS: Step[] = [
  {
    title: { en: 'Describe the problem', hi: 'समस्या बताइए' },
    body: {
      en: 'Type what is wrong in your own words, and say where it is. Then select “Find the right service”. You can also use the example below.',
      hi: 'अपने शब्दों में लिखें कि क्या समस्या है और कहाँ है। फिर “सही सेवा खोजें” चुनें। आप नीचे दिया उदाहरण भी इस्तेमाल कर सकते हैं।',
    },
    target: 'home-input',
    path: '/',
  },
  {
    title: { en: 'Answer the assistant', hi: 'सहायक के सवालों का जवाब दें' },
    body: {
      en: 'The assistant shows the likely category and responsible department, and explains why. Answer its questions — the area, a landmark, a photo (optional) and the date. You can correct anything in the summary.',
      hi: 'सहायक संभावित श्रेणी और ज़िम्मेदार विभाग दिखाता है और कारण बताता है। उसके सवालों का जवाब दें — इलाका, निश्चित स्थान, फोटो (वैकल्पिक) और तारीख। सारांश में कुछ भी सुधार सकते हैं।',
    },
    target: 'assistant-input',
    path: '/assistant',
  },
  {
    title: { en: 'Open the review', hi: 'समीक्षा खोलें' },
    body: {
      en: 'The required details are in. Check the summary, then select “Review complaint”. You can still add details in the chat first.',
      hi: 'ज़रूरी जानकारी पूरी है। सारांश जाँचें, फिर “शिकायत की समीक्षा करें” चुनें। चाहें तो पहले चैट में और जानकारी जोड़ें।',
    },
    target: 'assistant-review',
    path: '/assistant',
  },
  {
    title: { en: 'Check the details', hi: 'विवरण जाँचें' },
    body: {
      en: 'The form is filled in from your conversation. Fix anything that is wrong — red messages say what is missing. Then select “Continue to review”. Nothing is submitted yet.',
      hi: 'फ़ॉर्म आपकी बातचीत से भरा गया है। जो गलत हो उसे ठीक करें — लाल संदेश बताते हैं क्या कमी है। फिर “Continue to review” चुनें। अभी कुछ जमा नहीं होता।',
    },
    target: 'form-continue',
    path: '/complaint/new',
  },
  {
    title: { en: 'Confirm the complaint', hi: 'शिकायत की पुष्टि करें' },
    body: {
      en: 'Read the complaint text exactly as it will be submitted. If it is right, select “Looks correct — show submission steps”. Use “Edit” to change anything.',
      hi: 'शिकायत का पाठ ठीक वैसे पढ़ें जैसे वह जमा होगा। सही हो तो “Looks correct” चुनें। बदलाव के लिए “Edit” चुनें।',
    },
    target: 'review-confirm',
    path: '/complaint/new',
  },
  {
    title: { en: 'Submit on the official channel', hi: 'आधिकारिक माध्यम पर जमा करें' },
    body: {
      en: 'JanSeva does not submit for you. Copy the text, open the official portal, and save the reference number it gives you. To try it without a portal, select “Create simulated demo record”.',
      hi: 'जनसेवा आपकी ओर से जमा नहीं करता। पाठ कॉपी करें, आधिकारिक पोर्टल खोलें और मिली संदर्भ संख्या सहेजें। बिना पोर्टल के आज़माने के लिए “Create simulated demo record” चुनें।',
    },
    target: 'submit-options',
    path: '/complaint/new',
  },
  {
    title: { en: 'Track your complaint', hi: 'अपनी शिकायत ट्रैक करें' },
    body: {
      en: 'Your complaint is saved in My Complaints. Open it to follow the timeline, add follow-ups, and confirm or dispute the fix when the department reports it resolved.',
      hi: 'आपकी शिकायत “मेरी शिकायतें” में सहेजी गई है। उसे खोलकर समयरेखा देखें, फ़ॉलो-अप जोड़ें, और विभाग के हल बताने पर पुष्टि या आपत्ति दर्ज करें।',
    },
    target: 'complaint-timeline',
    path: '/complaints',
  },
];

const HIGHLIGHT = 'guide-target';
const HEADER_HEIGHT = 72;

/** Scroll just enough that `el` sits between the sticky header and the guide panel. */
function reveal(el: Element) {
  const r = el.getBoundingClientRect();
  const panel = document.querySelector('aside[data-guide-panel]');
  const bottomLimit = (panel?.getBoundingClientRect().top ?? window.innerHeight) - 24;
  // Too tall to fit between header and panel: show its start instead.
  if (r.height > bottomLimit - HEADER_HEIGHT) window.scrollBy({ top: r.top - HEADER_HEIGHT - 16, behavior: 'auto' });
  else if (r.bottom > bottomLimit) window.scrollBy({ top: r.bottom - bottomLimit, behavior: 'auto' });
  else if (r.top < HEADER_HEIGHT) window.scrollBy({ top: r.top - HEADER_HEIGHT - 16, behavior: 'auto' });
}

export default function GuidePanel() {
  const { active, checkpoint, furthest, exit } = useGuide();
  const { lang } = useLang();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const onFlow = checkpoint !== null && !(checkpoint === 'detail' && furthest < 5);
  const index = onFlow ? CHECKPOINT_STEP[checkpoint!] : furthest;
  const step = STEPS[index];

  // Outline the control the current step refers to. Polled because pages render targets lazily.
  useEffect(() => {
    if (!active || !onFlow || !step.target) return;
    let revealed = false;
    const apply = () => {
      document.querySelectorAll(`.${HIGHLIGHT}`).forEach((el) => {
        if ((el as HTMLElement).dataset.guide !== step.target) el.classList.remove(HIGHLIGHT);
      });
      const el = document.querySelector(`[data-guide="${step.target}"]`);
      if (!el) return;
      el.classList.add(HIGHLIGHT);
      // Once per step: if the target sits under the panel or off screen, bring it into view.
      if (!revealed) {
        revealed = true;
        reveal(el);
      }
    };
    apply();
    const id = window.setInterval(apply, 400);
    return () => {
      window.clearInterval(id);
      document.querySelectorAll(`.${HIGHLIGHT}`).forEach((el) => el.classList.remove(HIGHLIGHT));
    };
  }, [active, onFlow, step?.target]);

  // Reserve space so the panel never hides the end of the page.
  useEffect(() => {
    document.body.classList.toggle('guide-open', active);
    return () => document.body.classList.remove('guide-open');
  }, [active]);

  if (!active) return null;

  const showMe = () => {
    const el = document.querySelector(`[data-guide="${step.target}"]`) as HTMLElement | null;
    if (el) reveal(el);
    (el?.querySelector('textarea, input, button') as HTMLElement | null)?.focus({ preventScroll: true });
    if (el && ['TEXTAREA', 'INPUT', 'BUTTON'].includes(el.tagName)) el.focus({ preventScroll: true });
  };

  const last = index === STEPS.length - 1;
  const hi = lang === 'hi';

  return (
    <aside
      data-guide-panel
      role="complementary"
      aria-label={hi ? 'पहली शिकायत गाइड' : 'First complaint guide'}
      className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-accent bg-surface shadow-[0_-2px_8px_rgba(32,43,54,0.08)] sm:inset-x-auto sm:bottom-4 sm:right-4 sm:w-[360px] sm:border sm:border-t-4"
    >
      <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-2">
        <div className="text-xs text-muted">
          <span className="font-semibold text-accent">{hi ? 'पहली शिकायत गाइड' : 'First complaint guide'}</span>
          <span className="tnum"> · {hi ? 'चरण' : 'Step'} {index + 1} / {STEPS.length}</span>
        </div>
        <div className="flex items-center">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="rounded p-2 text-muted hover:text-accent"
            aria-expanded={!collapsed}
            aria-label={collapsed ? 'Expand guide' : 'Collapse guide'}
          >
            {collapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button onClick={() => exit()} className="rounded p-2 text-muted hover:text-crit" aria-label="Exit guide">
            <X size={16} />
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="px-4 py-3">
          <ol className="mb-3 flex gap-1" aria-hidden>
            {STEPS.map((_, i) => (
              <li key={i} className={`h-1 flex-1 ${i < index ? 'bg-ok' : i === index ? 'bg-accent' : 'bg-line'}`} />
            ))}
          </ol>

          {onFlow ? (
            <>
              <h2 className="text-sm font-semibold">{step.title[lang]}</h2>
              <p className="mt-1 text-sm leading-relaxed text-ink/90">{step.body[lang]}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {index === 0 && (
                  <button className="btn-primary py-1.5 text-xs" onClick={() => navigate(`/assistant?q=${encodeURIComponent(EXAMPLE_PROMPTS[lang][0])}`)}>
                    {hi ? 'उदाहरण इस्तेमाल करें' : 'Use an example'}
                  </button>
                )}
                {step.target && !last && (
                  <button className="btn-secondary py-1.5 text-xs" onClick={showMe}>
                    {hi ? 'कहाँ है, दिखाएँ' : 'Show me where'}
                  </button>
                )}
                {last && (
                  <>
                    {checkpoint !== 'detail' && (
                      <Link to="/complaints" className="btn-secondary py-1.5 text-xs">
                        {hi ? 'मेरी शिकायतें' : 'Open My Complaints'}
                      </Link>
                    )}
                    <button className="btn-primary py-1.5 text-xs" onClick={() => exit(true)}>
                      {hi ? 'गाइड पूरा करें' : 'Finish guide'}
                    </button>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <h2 className="text-sm font-semibold">{hi ? 'आप गाइड से बाहर के पेज पर हैं' : 'You are outside the complaint steps'}</h2>
              <p className="mt-1 text-sm text-muted">
                {hi ? `अगला चरण: ${step.title.hi}` : `Next step: ${step.title.en}`}
              </p>
              <div className="mt-3 flex gap-2">
                <Link to={step.path} className="btn-primary py-1.5 text-xs">
                  {hi ? 'जहाँ छोड़ा था वहीं जाएँ' : 'Continue where I left off'}
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </aside>
  );
}
