import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { load, save } from '../lib/storage';

export type Lang = 'en' | 'hi';

const STRINGS = {
  'nav.home': { en: 'Home', hi: 'होम' },
  'nav.report': { en: 'Report an Issue', hi: 'शिकायत दर्ज करें' },
  'nav.complaints': { en: 'My Complaints', hi: 'मेरी शिकायतें' },
  'nav.dashboard': { en: 'Public Dashboard', hi: 'सार्वजनिक डैशबोर्ड' },
  'nav.services': { en: 'Services', hi: 'सेवाएँ' },
  'nav.authorities': { en: 'Authorities', hi: 'प्राधिकरण' },
  'nav.privacy': { en: 'Privacy', hi: 'गोपनीयता' },
  'nav.demo': { en: 'Demo settings', hi: 'डेमो सेटिंग्स' },
  'disclaimer': {
    en: 'Prototype for demonstration. Not a government website. Records and statistics are sample data.',
    hi: 'यह प्रदर्शन हेतु प्रोटोटाइप है, सरकारी वेबसाइट नहीं। सभी रिकॉर्ड और आँकड़े नमूना डेटा हैं।',
  },
  'guide.name': { en: 'First complaint guide', hi: 'पहली शिकायत गाइड' },
  'guide.start': { en: 'Start the guide', hi: 'गाइड शुरू करें' },
  'guide.bannerTitle': { en: 'First time here?', hi: 'पहली बार आए हैं?' },
  'guide.bannerBody': {
    en: 'A short step-by-step guide shows you how to register your first complaint, from describing the problem to tracking it.',
    hi: 'एक छोटी चरण-दर-चरण गाइड बताती है कि पहली शिकायत कैसे दर्ज करें — समस्या बताने से लेकर उसे ट्रैक करने तक।',
  },
  'guide.noThanks': { en: 'No thanks', hi: 'अभी नहीं' },
  'guide.link': { en: 'New to JanSeva? Follow the step-by-step guide', hi: 'जनसेवा में नए हैं? चरण-दर-चरण गाइड देखें' },
  'home.title': { en: 'Government services, made easier.', hi: 'सरकारी सेवाएँ, अब आसान।' },
  'home.lead': {
    en: 'Describe a problem in your own words. JanSeva finds the responsible department and the official channel, helps you prepare the complaint, and keeps track of what happens next.',
    hi: 'अपनी समस्या अपने शब्दों में बताइए। जनसेवा ज़िम्मेदार विभाग और आधिकारिक माध्यम खोजता है, शिकायत तैयार करने में मदद करता है, और आगे की स्थिति पर नज़र रखता है।',
  },
  'home.placeholder': { en: 'Describe your problem in your own words...', hi: 'अपनी समस्या अपने शब्दों में लिखें...' },
  'home.cta': { en: 'Find the right service', hi: 'सही सेवा खोजें' },
  'home.quick': { en: 'Common issues', hi: 'आम समस्याएँ' },
  'home.recent': { en: 'Your recent complaints', hi: 'आपकी हाल की शिकायतें' },
  'home.area': { en: 'Your area at a glance', hi: 'आपका क्षेत्र एक नज़र में' },
  'common.viewAll': { en: 'View all', hi: 'सभी देखें' },
  'assistant.title': { en: 'Report an issue', hi: 'शिकायत दर्ज करें' },
  'assistant.greeting': {
    en: 'Hello. Describe the issue you want to report. I can help identify the responsible department, prepare your complaint, and find the appropriate official submission channel.',
    hi: 'नमस्ते। आप जिस समस्या की शिकायत करना चाहते हैं, उसका वर्णन करें। मैं ज़िम्मेदार विभाग पहचानने, शिकायत तैयार करने और सही आधिकारिक माध्यम खोजने में मदद कर सकता हूँ।',
  },
  'assistant.input': { en: 'Type your message…', hi: 'अपना संदेश लिखें…' },
  'assistant.send': { en: 'Send', hi: 'भेजें' },
  'assistant.examples': { en: 'Try an example', hi: 'उदाहरण आज़माएँ' },
  'assistant.review': { en: 'Review complaint', hi: 'शिकायत की समीक्षा करें' },
  'assistant.summary': { en: 'Complaint summary', hi: 'शिकायत सारांश' },
  'assistant.restart': { en: 'Start over', hi: 'फिर से शुरू करें' },
  'complaints.title': { en: 'My complaints', hi: 'मेरी शिकायतें' },
  'complaints.search': { en: 'Search by title or reference number', hi: 'शीर्षक या संदर्भ संख्या से खोजें' },
  'dashboard.title': { en: 'Public grievance and service accountability', hi: 'सार्वजनिक शिकायत और सेवा जवाबदेही' },
  'dashboard.subtitle': {
    en: 'Explore reported issues and grievance outcomes by locality and department.',
    hi: 'इलाके और विभाग के अनुसार दर्ज समस्याएँ और शिकायतों के परिणाम देखें।',
  },
  'services.title': { en: 'Government services directory', hi: 'सरकारी सेवा निर्देशिका' },
  'services.search': { en: 'Search services, departments or purposes', hi: 'सेवा, विभाग या उद्देश्य खोजें' },
  'authorities.title': { en: 'Public authority directory', hi: 'सार्वजनिक प्राधिकरण निर्देशिका' },
} as const;

export type StringKey = keyof typeof STRINGS;

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: StringKey) => string;
}

const Ctx = createContext<LangCtx | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => load<Lang>('lang', 'en'));
  useEffect(() => {
    save('lang', lang);
    document.documentElement.lang = lang === 'hi' ? 'hi' : 'en';
  }, [lang]);
  const t = (key: StringKey) => STRINGS[key][lang];
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export function useLang() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useLang outside LanguageProvider');
  return c;
}
