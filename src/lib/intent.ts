import type { CategoryId, ComplaintDraft } from '../data/types';
import { LOCALITIES, categoryLabel, departmentById, localityById } from '../data/reference';
import { serviceById } from '../data/directory';
import { formatDate } from './format';

/**
 * Deterministic, rule-based intent detection for the demo.
 * This is keyword matching, not a trained language model.
 */
const KEYWORDS: Record<Exclude<CategoryId, 'other'>, string[]> = {
  roads: ['pothole', 'potholes', 'road', 'damaged road', 'broken road', 'crater', 'speed breaker', 'footpath broken', 'गड्ढा', 'गड्ढे', 'सड़क', 'टूटी सड़क'],
  parking: ['parking', 'parked', 'illegal parking', 'blocking', 'obstruction', 'encroachment', 'double parked', 'traffic jam', 'पार्किंग', 'गाड़ी खड़ी', 'जाम', 'रास्ता रोक'],
  garbage: ['garbage', 'trash', 'waste', 'dump', 'dumping', 'litter', 'sanitation', 'sweeping', 'dustbin', 'कूड़ा', 'कचरा', 'गंदगी', 'सफाई'],
  water: ['water', 'drain', 'drainage', 'sewer', 'sewage', 'manhole', 'waterlogging', 'waterlogged', 'pipeline', 'leak', 'overflow', 'पानी', 'नाली', 'सीवर', 'जलभराव'],
  streetlights: ['streetlight', 'street light', 'streetlights', 'street lights', 'light not working', 'dark street', 'lamp post', 'स्ट्रीट लाइट', 'बत्ती', 'लाइट खराब', 'अंधेरा'],
  health: ['hospital', 'doctor', 'opd', 'medicine', 'ambulance', 'clinic', 'health centre', 'phc', 'nurse', 'अस्पताल', 'डॉक्टर', 'दवा', 'एम्बुलेंस'],
  education: ['school', 'teacher', 'classroom', 'mid-day meal', 'midday meal', 'students', 'toilet in school', 'स्कूल', 'विद्यालय', 'शिक्षक', 'मिड डे मील'],
};

export interface Classification {
  category: CategoryId | null;
  matched: string[];
  runnerUp: CategoryId | null;
}

export function classify(text: string): Classification {
  const t = ' ' + text.toLowerCase() + ' ';
  const scores: { id: CategoryId; matched: string[] }[] = [];
  for (const [id, words] of Object.entries(KEYWORDS) as [CategoryId, string[]][]) {
    const matched = words.filter((w) => t.includes(w));
    // Longer phrases are more specific; drop single words already covered by a phrase.
    const unique = matched.filter((w) => !matched.some((o) => o !== w && o.includes(w)));
    if (unique.length) scores.push({ id, matched: unique });
  }
  scores.sort((a, b) => b.matched.length - a.matched.length);
  // "road" alone alongside a stronger signal (e.g. "parked on the road") should not win.
  if (scores.length > 1 && scores[0].id === 'roads' && scores[0].matched.length === scores[1].matched.length) {
    scores.splice(0, 2, scores[1], scores[0]);
  }
  return {
    category: scores[0]?.id ?? null,
    matched: scores[0]?.matched ?? [],
    runnerUp: scores[1]?.id ?? null,
  };
}

export interface LocationGuess {
  localityId: string | null;
  matchedAlias: string | null;
  pin: string | null;
  landmark: string | null;
}

export function extractLocation(text: string): LocationGuess {
  const t = text.toLowerCase();
  let localityId: string | null = null;
  let matchedAlias: string | null = null;
  for (const l of LOCALITIES) {
    const alias = l.aliases.find((a) => new RegExp(`(^|[^a-z0-9])${escapeRe(a)}([^0-9]|$)`).test(t));
    if (alias) {
      localityId = l.id;
      matchedAlias = alias;
      break;
    }
  }
  const pinMatch = text.match(/\b1[0-9]{5}\b/);
  const landmarkMatch = text.match(/\b(?:near|opposite|behind|next to|in front of|outside)\s+([^,.;!?]+?)(?=\s+(?:in|at|of)\s+[A-Z]|[,.;!?]|$)/i);
  let landmark = landmarkMatch ? landmarkMatch[0].trim() : null;
  if (!landmark) {
    const hi = text.match(/([^\s,।]+(?:\s+[^\s,।]+){0,3})\s+के\s+(?:पास|सामने|पीछे)/);
    if (hi) landmark = hi[0].trim();
  }
  return { localityId, matchedAlias, pin: pinMatch ? pinMatch[0] : null, landmark };
}

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const TITLE_TEMPLATES: Record<CategoryId, string> = {
  roads: 'Road damage / pothole',
  parking: 'Illegal parking causing obstruction',
  garbage: 'Garbage accumulation',
  water: 'Water supply / drainage problem',
  streetlights: 'Streetlight not working',
  health: 'Issue with public hospital services',
  education: 'Facility issue at government school',
  other: 'Public service grievance',
};

export function suggestTitle(category: CategoryId | '', landmark: string, localityId: string): string {
  const base = category ? TITLE_TEMPLATES[category] : 'Public grievance';
  const loc = localityById(localityId);
  const where = landmark || loc?.name;
  return where ? `${base} — ${where}` : base;
}

export function buildComplaintText(d: ComplaintDraft, lang: 'en' | 'hi'): string {
  const loc = localityById(d.localityId);
  const dept = departmentById(d.departmentId);
  const svc = serviceById(d.serviceId);
  const where = [d.landmark, loc?.name, d.city || loc?.city].filter(Boolean).join(', ');
  const pin = d.pin || loc?.pin || '';
  if (lang === 'hi') {
    return [
      `विषय: ${d.title || categoryLabel(d.category, 'hi')}`,
      '',
      `सेवा में: ${dept?.name ?? 'संबंधित विभाग'}`,
      '',
      `स्थान: ${where}${pin ? ` – ${pin}` : ''}`,
      '',
      d.description.trim(),
      '',
      d.incidentDate ? `समस्या पहली बार ${formatDate(d.incidentDate)} को देखी गई।` : '',
      d.photoName ? 'साक्ष्य के रूप में फोटो संलग्न है।' : '',
      'कृपया स्थल का निरीक्षण करके आवश्यक कार्रवाई करें और शिकायत की स्थिति से अवगत कराएँ।',
      '',
      `(${svc?.name ?? 'आधिकारिक पोर्टल'} पर संपर्क विवरण दिया जाएगा)`,
    ]
      .filter((l, i, a) => !(l === '' && a[i - 1] === ''))
      .join('\n');
  }
  return [
    `Subject: ${d.title || categoryLabel(d.category)}`,
    '',
    `To: ${dept?.name ?? 'The concerned department'}`,
    '',
    `Location: ${where || 'as given on the portal'}${pin ? ` – ${pin}` : ''}`,
    '',
    d.description.trim(),
    '',
    d.incidentDate ? `The issue was first noticed on ${formatDate(d.incidentDate)}.` : '',
    d.photoName ? 'A photograph of the issue is attached as evidence.' : '',
    'I request that the location be inspected and necessary action taken, and that I be informed of the status of this complaint.',
    '',
    `(Contact details will be provided on ${svc?.name ?? 'the official portal'}.)`,
  ]
    .filter((l, i, a) => !(l === '' && a[i - 1] === ''))
    .join('\n');
}

export const EXAMPLE_PROMPTS = {
  en: [
    'There is a large pothole near Sector 15 market in Faridabad.',
    'Cars are parked on the footpath outside the school gate in Sector 21 every morning.',
    'Garbage has not been collected for a week near Railway road, Old Faridabad.',
    'The streetlights near Ballabgarh bus stand are not working.',
  ],
  hi: [
    'फरीदाबाद में सेक्टर 15 मार्केट के पास सड़क पर बड़ा गड्ढा है।',
    'एनआईटी में नीलम चौक के पास सीवर का पानी सड़क पर बह रहा है।',
    'बल्लभगढ़ बस स्टैंड के पास स्ट्रीट लाइट खराब है।',
    'सरकारी अस्पताल में डॉक्टर समय पर नहीं आते।',
  ],
};

export const QUICK_TOPICS: { id: CategoryId; prompt: { en: string; hi: string } }[] = [
  { id: 'roads', prompt: { en: 'I want to report a pothole / damaged road.', hi: 'मुझे सड़क पर गड्ढे की शिकायत करनी है।' } },
  { id: 'parking', prompt: { en: 'I want to report illegal parking blocking the road.', hi: 'मुझे अवैध पार्किंग की शिकायत करनी है।' } },
  { id: 'garbage', prompt: { en: 'I want to report garbage that has not been collected.', hi: 'मुझे कूड़ा न उठाए जाने की शिकायत करनी है।' } },
  { id: 'water', prompt: { en: 'I want to report a water supply or drainage problem.', hi: 'मुझे पानी या नाली की समस्या की शिकायत करनी है।' } },
  { id: 'streetlights', prompt: { en: 'I want to report a streetlight that is not working.', hi: 'मुझे खराब स्ट्रीट लाइट की शिकायत करनी है।' } },
  { id: 'other', prompt: { en: 'I have a problem with another public service.', hi: 'मुझे किसी अन्य सरकारी सेवा से जुड़ी समस्या है।' } },
];
