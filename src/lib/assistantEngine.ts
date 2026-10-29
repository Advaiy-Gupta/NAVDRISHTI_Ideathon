import type { CategoryId } from '../data/types';
import { CATEGORIES, LOCALITIES, categoryLabel, departmentById, localityById, resolveJurisdiction } from '../data/reference';
import { serviceById } from '../data/directory';
import { classify, extractLocation } from './intent';
import type { Lang } from '../state/i18n';

/**
 * Conversation state machine for the grievance assistant.
 * Deterministic: the same inputs always produce the same replies.
 */

export type Ask = 'description' | 'category' | 'locality' | 'landmark' | 'photo' | 'date' | 'done';

export interface ChatOption {
  label: string;
  kind: 'category' | 'locality' | 'landmark-keep' | 'photo-skip' | 'photo-attach' | 'date' | 'review';
  value: string;
}

export interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  /** Short heading shown above structured assistant explanations. */
  heading?: string;
  options?: ChatOption[];
  photoUrl?: string;
}

export interface AssistantDraft {
  description: string[];
  category: CategoryId | null;
  matched: string[];
  runnerUp: CategoryId | null;
  categoryManual: boolean;
  localityId: string;
  pin: string;
  landmark: string;
  /** False when the landmark was only inferred from the description. */
  landmarkConfirmed: boolean;
  photoName: string;
  photoUrl: string;
  photoSkipped: boolean;
  incidentDate: string;
}

export const EMPTY_ASSISTANT_DRAFT: AssistantDraft = {
  description: [],
  category: null,
  matched: [],
  runnerUp: null,
  categoryManual: false,
  localityId: '',
  pin: '',
  landmark: '',
  landmarkConfirmed: false,
  photoName: '',
  photoUrl: '',
  photoSkipped: false,
  incidentDate: '',
};

let seq = 0;
export const msgId = () => `m${Date.now()}-${++seq}`;

const pick = (lang: Lang, en: string, hi: string) => (lang === 'hi' ? hi : en);

export function nextAsk(d: AssistantDraft): Ask {
  if (!d.category) return 'category';
  if (!d.localityId) return 'locality';
  if (!d.landmark || !d.landmarkConfirmed) return 'landmark';
  if (!d.photoUrl && !d.photoSkipped) return 'photo';
  if (!d.incidentDate) return 'date';
  return 'done';
}

export function isoDaysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

/** Merge a free-text user message into the draft, depending on what was last asked. */
export function absorb(d: AssistantDraft, text: string, asked: Ask): AssistantDraft {
  const next: AssistantDraft = { ...d };
  const loc = extractLocation(text);

  if (asked === 'landmark') {
    next.landmark = text.trim();
    next.landmarkConfirmed = true;
  } else if (asked === 'locality') {
    if (!loc.localityId) {
      const typed = LOCALITIES.find((l) => text.toLowerCase().includes(l.name.toLowerCase()));
      if (typed) next.localityId = typed.id;
    }
  } else {
    next.description = [...d.description, text.trim()];
  }

  if (!next.categoryManual) {
    const c = classify([...next.description, asked === 'category' ? text : ''].join(' '));
    if (c.category) {
      next.category = c.category;
      next.matched = c.matched;
      next.runnerUp = c.runnerUp;
    } else if (asked === 'category') {
      next.category = 'other';
      next.matched = [];
    }
  }
  if (loc.localityId) next.localityId = loc.localityId;
  if (loc.pin) next.pin = loc.pin;
  if (loc.landmark && !next.landmark) next.landmark = loc.landmark;
  return next;
}

/** Assistant replies after the draft changed from `before` to `after`. */
export function respond(before: AssistantDraft, after: AssistantDraft, lang: Lang): ChatMessage[] {
  const out: ChatMessage[] = [];
  const catChanged = after.category && after.category !== before.category;
  const locChanged = after.localityId && after.localityId !== before.localityId;

  if (catChanged && after.category) {
    const label = categoryLabel(after.category, lang);
    const why = after.matched.length
      ? pick(
          lang,
          `I matched the term${after.matched.length > 1 ? 's' : ''} ${after.matched.map((m) => `“${m}”`).join(', ')} in your description, which ${after.matched.length > 1 ? 'are' : 'is'} associated with this category.`,
          `आपके विवरण में ${after.matched.map((m) => `“${m}”`).join(', ')} शब्द मिले, जो इस श्रेणी से जुड़े हैं।`,
        )
      : after.categoryManual
        ? pick(lang, 'You selected this category.', 'आपने यह श्रेणी चुनी।')
        : pick(lang, 'No specific keywords matched, so I have used the general category.', 'कोई विशेष शब्द नहीं मिला, इसलिए सामान्य श्रेणी चुनी गई है।');
    const alt =
      after.runnerUp && !after.categoryManual
        ? pick(
            lang,
            ` It may also relate to ${categoryLabel(after.runnerUp, 'en').toLowerCase()}; you can change the category in the summary.`,
            ` यह ${categoryLabel(after.runnerUp, 'hi')} से भी जुड़ा हो सकता है; आप सारांश में श्रेणी बदल सकते हैं।`,
          )
        : '';
    out.push({
      id: msgId(),
      role: 'assistant',
      heading: pick(lang, `Likely category: ${label}`, `संभावित श्रेणी: ${label}`),
      text: why + alt,
    });
  }

  if ((locChanged || (catChanged && after.localityId)) && after.category) {
    const loc = localityById(after.localityId)!;
    const j = resolveJurisdiction(after.category, after.localityId);
    const dept = departmentById(j.departmentId)!;
    const svc = serviceById(j.serviceId)!;
    out.push({
      id: msgId(),
      role: 'assistant',
      heading: pick(lang, `Responsible authority: ${dept.shortName}`, `ज़िम्मेदार विभाग: ${dept.shortName}`),
      text: pick(
        lang,
        `Location understood as ${loc.name}, ${loc.city} (PIN ${after.pin || loc.pin}). ${j.reason} Suggested channel: ${svc.name}${svc.urlStatus === 'mock' ? ' (mock link in this demo)' : ''}.`,
        `स्थान: ${loc.name}, ${loc.city} (पिन ${after.pin || loc.pin})। नमूना क्षेत्राधिकार डेटा के अनुसार यह ${dept.name} के अंतर्गत आता है। सुझाया गया माध्यम: ${svc.name}${svc.urlStatus === 'mock' ? ' (डेमो में नकली लिंक)' : ''}।`,
      ),
    });
  }

  out.push(question(nextAsk(after), lang, after));
  return out;
}

export function question(ask: Ask, lang: Lang, d: AssistantDraft): ChatMessage {
  switch (ask) {
    case 'category':
    case 'description':
      return {
        id: msgId(),
        role: 'assistant',
        text: pick(
          lang,
          'I could not identify the type of issue from that. Which of these is closest?',
          'मैं समस्या का प्रकार नहीं पहचान पाया। इनमें से कौन-सा सबसे करीब है?',
        ),
        options: CATEGORIES.map((c) => ({ kind: 'category', value: c.id, label: lang === 'hi' ? c.labelHi : c.label })),
      };
    case 'locality':
      return {
        id: msgId(),
        role: 'assistant',
        text: pick(
          lang,
          'Which locality is this in? The demo directory covers these areas of Faridabad.',
          'यह किस इलाके में है? डेमो निर्देशिका में फरीदाबाद के ये इलाके शामिल हैं।',
        ),
        options: LOCALITIES.map((l) => ({ kind: 'locality', value: l.id, label: l.name })),
      };
    case 'landmark':
      if (d.landmark)
        return {
          id: msgId(),
          role: 'assistant',
          text: pick(
            lang,
            `I noted the location as “${d.landmark}”. Can you make it more precise — a shop name, gate, pole number or house number? This helps the field team find the spot.`,
            `मैंने स्थान “${d.landmark}” दर्ज किया है। क्या आप इसे और सटीक बता सकते हैं — दुकान का नाम, गेट, खंभा नंबर या मकान नंबर? इससे टीम को जगह ढूँढने में मदद मिलती है।`,
          ),
          options: [{ kind: 'landmark-keep', value: 'keep', label: pick(lang, 'Keep as it is', 'जैसा है वैसा रखें') }],
        };
      return {
        id: msgId(),
        role: 'assistant',
        text: pick(
          lang,
          'Can you give a precise landmark, such as a shop, gate, pole number or house number nearby? This helps the field team find the spot.',
          'क्या आप पास का कोई निश्चित स्थान बता सकते हैं, जैसे दुकान, गेट, खंभा नंबर या मकान नंबर? इससे टीम को जगह ढूँढने में मदद मिलती है।',
        ),
      };
    case 'photo':
      return {
        id: msgId(),
        role: 'assistant',
        text: pick(
          lang,
          `${d.landmark ? `Noted: “${d.landmark}”. ` : ''}A photo helps the department verify the issue. You can attach one now — it stays on your device in this prototype — or skip this step.`,
          `${d.landmark ? `दर्ज किया: “${d.landmark}”। ` : ''}फोटो से विभाग को समस्या की पुष्टि करने में मदद मिलती है। आप अभी फोटो जोड़ सकते हैं — इस प्रोटोटाइप में यह आपके डिवाइस पर ही रहती है — या यह चरण छोड़ सकते हैं।`,
        ),
        options: [
          { kind: 'photo-attach', value: 'attach', label: pick(lang, 'Attach a photo', 'फोटो जोड़ें') },
          { kind: 'photo-skip', value: 'skip', label: pick(lang, 'Skip for now', 'अभी छोड़ें') },
        ],
      };
    case 'date':
      return {
        id: msgId(),
        role: 'assistant',
        text: pick(lang, 'When did you first notice the problem?', 'आपने यह समस्या पहली बार कब देखी?'),
        options: [
          { kind: 'date', value: isoDaysAgo(0), label: pick(lang, 'Today', 'आज') },
          { kind: 'date', value: isoDaysAgo(1), label: pick(lang, 'Yesterday', 'कल') },
          { kind: 'date', value: isoDaysAgo(7), label: pick(lang, 'About a week ago', 'लगभग एक हफ्ते पहले') },
          { kind: 'date', value: isoDaysAgo(30), label: pick(lang, 'A month or more', 'एक महीना या अधिक') },
        ],
      };
    case 'done':
      return {
        id: msgId(),
        role: 'assistant',
        heading: pick(lang, 'Ready for review', 'समीक्षा के लिए तैयार'),
        text: pick(
          lang,
          'I have prepared a draft complaint. Check the summary, change anything that is wrong, and then review the full complaint before you submit it on the official channel. You can still add more details here.',
          'मैंने शिकायत का मसौदा तैयार कर दिया है। सारांश जाँचें, जो गलत हो उसे बदलें, फिर आधिकारिक माध्यम पर जमा करने से पहले पूरी शिकायत की समीक्षा करें। आप यहाँ और जानकारी भी जोड़ सकते हैं।',
        ),
        options: [{ kind: 'review', value: 'review', label: pick(lang, 'Review complaint', 'शिकायत की समीक्षा करें') }],
      };
  }
}
