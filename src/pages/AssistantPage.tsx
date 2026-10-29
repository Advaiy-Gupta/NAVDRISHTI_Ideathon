import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Paperclip, Send } from 'lucide-react';
import { useLang } from '../state/i18n';
import { useStore } from '../state/store';
import {
  EMPTY_ASSISTANT_DRAFT,
  absorb,
  msgId,
  nextAsk,
  question,
  respond,
  type Ask,
  type AssistantDraft,
  type ChatMessage,
  type ChatOption,
} from '../lib/assistantEngine';
import { EXAMPLE_PROMPTS, buildComplaintText, suggestTitle } from '../lib/intent';
import { localityById, resolveJurisdiction } from '../data/reference';
import SummaryPanel from '../components/assistant/SummaryPanel';
import ChatBubble from '../components/assistant/ChatBubble';
import type { ComplaintDraft } from '../data/types';
import { useGuideCheckpoint } from '../state/guide';

const greeting = (text: string): ChatMessage => ({ id: 'greeting', role: 'assistant', text });

export default function AssistantPage() {
  const { t, lang, setLang } = useLang();
  const { dispatch } = useStore();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const [messages, setMessages] = useState<ChatMessage[]>([greeting(t('assistant.greeting'))]);
  const [draft, setDraft] = useState<AssistantDraft>(EMPTY_ASSISTANT_DRAFT);
  const [asked, setAsked] = useState<Ask>('description');
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const started = messages.length > 1;
  useGuideCheckpoint(asked === 'done' ? 'assistant-ready' : 'assistant');

  // Keep the greeting in the selected language until the conversation starts.
  // Only on an actual language change, so a message sent on mount (?q=) is not wiped.
  const greetedLang = useRef(lang);
  useEffect(() => {
    if (greetedLang.current === lang) return;
    greetedLang.current = lang;
    setMessages((m) => (m.length > 1 ? m : [greeting(t('assistant.greeting'))]));
  }, [lang]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, thinking]);

  // A problem typed on the home page arrives as ?q=
  const consumed = useRef(false);
  useEffect(() => {
    const q = params.get('q');
    if (q && !consumed.current) {
      consumed.current = true;
      setParams({}, { replace: true });
      send(q);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function reply(after: AssistantDraft, msgs: ChatMessage[]) {
    setThinking(true);
    window.setTimeout(() => {
      setMessages((m) => [...m, ...msgs]);
      setAsked(nextAsk(after));
      setThinking(false);
    }, 450);
  }

  function send(raw: string) {
    const text = raw.trim();
    if (!text || thinking) return;
    setMessages((m) => [...m, { id: msgId(), role: 'user', text }]);
    setInput('');
    if (asked === 'photo' && /^(skip|no|none|नहीं|छोड़ें|अभी छोड़ें)\b/i.test(text)) {
      const after = { ...draft, photoSkipped: true };
      setDraft(after);
      reply(after, [question(nextAsk(after), lang, after)]);
      return;
    }
    const after = absorb(draft, text, asked);
    setDraft(after);
    let msgs = respond(draft, after, lang);
    if (asked === 'done' && msgs.length === 1) {
      msgs = [
        {
          id: msgId(),
          role: 'assistant',
          text: lang === 'hi' ? 'यह जानकारी विवरण में जोड़ दी गई है।' : 'Added to the description. The summary has been updated.',
          options: msgs[0].options,
        },
      ];
    }
    reply(after, msgs);
  }

  function choose(opt: ChatOption) {
    if (thinking) return;
    if (opt.kind === 'review') return review();
    if (opt.kind === 'photo-attach') return fileRef.current?.click();
    setMessages((m) => [...m, { id: msgId(), role: 'user', text: opt.label }]);
    let after = draft;
    if (opt.kind === 'category') after = { ...draft, category: opt.value as AssistantDraft['category'], categoryManual: true, matched: [], runnerUp: null };
    if (opt.kind === 'locality') after = { ...draft, localityId: opt.value, pin: '' };
    if (opt.kind === 'landmark-keep') after = { ...draft, landmarkConfirmed: true };
    if (opt.kind === 'photo-skip') after = { ...draft, photoSkipped: true };
    if (opt.kind === 'date') after = { ...draft, incidentDate: opt.value };
    setDraft(after);
    reply(after, respond(draft, after, lang));
  }

  function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) return setPhotoError('Please choose an image file (JPG or PNG).');
    if (file.size > 5 * 1024 * 1024) return setPhotoError('The image is larger than 5 MB. Please choose a smaller one.');
    setPhotoError('');
    const url = URL.createObjectURL(file);
    const after = { ...draft, photoUrl: url, photoName: file.name };
    setMessages((m) => [...m, { id: msgId(), role: 'user', text: file.name, photoUrl: url }]);
    setDraft(after);
    reply(after, [question(nextAsk(after), lang, after)]);
  }

  /** Changes made directly in the summary panel. */
  function editDraft(patch: Partial<AssistantDraft>) {
    const after = { ...draft, ...patch };
    setDraft(after);
    setAsked(nextAsk(after));
  }

  function restart() {
    setMessages([greeting(t('assistant.greeting'))]);
    setDraft(EMPTY_ASSISTANT_DRAFT);
    setAsked('description');
    setInput('');
  }

  function review() {
    if (!draft.category || !draft.localityId) return;
    const loc = localityById(draft.localityId)!;
    const j = resolveJurisdiction(draft.category, draft.localityId);
    const d: ComplaintDraft = {
      title: suggestTitle(draft.category, draft.landmark, draft.localityId),
      category: draft.category,
      description: draft.description.join(' '),
      complaintText: '',
      state: loc.state,
      city: loc.city,
      localityId: loc.id,
      ward: loc.ward,
      pin: draft.pin || loc.pin,
      landmark: draft.landmark,
      coordinates: '',
      incidentDate: draft.incidentDate,
      departmentId: j.departmentId,
      serviceId: j.serviceId,
      photoName: draft.photoName,
      photoUrl: draft.photoUrl,
    };
    d.complaintText = buildComplaintText(d, lang);
    dispatch({ type: 'draft', draft: d });
    navigate('/complaint/new');
  }

  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');

  return (
    <div className="container-page py-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{t('assistant.title')}</h1>
          <p className="mt-1 text-sm text-muted">
            {lang === 'hi'
              ? 'यह डेमो नियम-आधारित कीवर्ड मिलान का उपयोग करता है, कोई प्रशिक्षित AI मॉडल नहीं।'
              : 'This demo uses deterministic keyword rules to simulate the assistant. It is not a trained AI model.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded border border-line text-xs" role="group" aria-label="Assistant language">
            {(['en', 'hi'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                aria-pressed={lang === l}
                className={`tap px-3 py-2 lg:py-1.5 ${lang === l ? 'bg-accent text-white' : 'bg-surface hover:bg-accent-tint'}`}
              >
                {l === 'en' ? 'English' : 'हिंदी'}
              </button>
            ))}
          </div>
          {started && (
            <button onClick={restart} className="btn-secondary py-1.5 text-xs">
              {t('assistant.restart')}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <section className="panel flex h-[min(680px,calc(100vh-180px))] min-h-[480px] flex-col" aria-label="Conversation">
          <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-5" aria-live="polite">
            {messages.map((m) => (
              <ChatBubble key={m.id} message={m} onOption={choose} active={m.id === lastAssistant?.id && !thinking} />
            ))}
            {thinking && (
              <div className="text-sm text-muted" role="status">
                {lang === 'hi' ? 'सेवा निर्देशिका जाँची जा रही है…' : 'Checking the service directory…'}
              </div>
            )}
            {!started && (
              <div className="pt-2">
                <div className="eyebrow">{t('assistant.examples')}</div>
                <ul className="mt-2 space-y-1.5">
                  {EXAMPLE_PROMPTS[lang].map((p) => (
                    <li key={p}>
                      <button onClick={() => send(p)} className="w-full border border-line px-3 py-2 text-left text-sm hover:border-accent hover:bg-accent-tint">
                        {p}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          {photoError && <p className="error-text px-4">{photoError}</p>}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-end gap-2 border-t border-line p-3"
            data-guide="assistant-input"
          >
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="rounded border border-line p-2 text-muted hover:border-accent hover:text-accent"
              aria-label="Attach a photo"
              title="Attach a photo"
            >
              <Paperclip size={18} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPhoto} />
            <label htmlFor="chat-input" className="sr-only">
              {t('assistant.input')}
            </label>
            <textarea
              id="chat-input"
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder={t('assistant.input')}
              className="input max-h-32 min-h-[40px] resize-none"
            />
            <button type="submit" className="btn-primary h-10" disabled={!input.trim() || thinking}>
              <Send size={16} aria-hidden />
              <span className="hidden sm:inline">{t('assistant.send')}</span>
            </button>
          </form>
        </section>

        <SummaryPanel draft={draft} onEdit={editDraft} onReview={review} onAttach={() => fileRef.current?.click()} />
      </div>
    </div>
  );
}
