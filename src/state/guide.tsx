import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { load, save } from '../lib/storage';

/**
 * First-complaint guide. Pages report where the citizen is ("checkpoints");
 * the guide panel turns that into the current step.
 */
export type Checkpoint =
  | 'home'
  | 'assistant'
  | 'assistant-ready'
  | 'form-edit'
  | 'form-review'
  | 'form-guidance'
  | 'done'
  | 'detail';

export const CHECKPOINT_STEP: Record<Checkpoint, number> = {
  home: 0,
  assistant: 1,
  'assistant-ready': 2,
  'form-edit': 3,
  'form-review': 4,
  'form-guidance': 5,
  done: 6,
  detail: 6,
};

interface GuideState {
  active: boolean;
  /** Furthest step reached, so leaving the flow can offer "continue". */
  furthest: number;
  /** Banner on the home page was dismissed or the guide was completed. */
  dismissed: boolean;
}

interface GuideCtx extends GuideState {
  checkpoint: Checkpoint | null;
  start: () => void;
  exit: (completed?: boolean) => void;
  dismissBanner: () => void;
  report: (c: Checkpoint | null) => void;
}

const Ctx = createContext<GuideCtx | null>(null);

export function GuideProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GuideState>(() => load<GuideState>('guide', { active: false, furthest: 0, dismissed: false }));
  const [checkpoint, setCheckpoint] = useState<Checkpoint | null>(null);

  useEffect(() => save('guide', state), [state]);

  // Track the furthest step reached while the guide is running.
  useEffect(() => {
    if (!state.active || !checkpoint) return;
    // Opening an existing complaint only counts once the citizen has reached submission.
    if (checkpoint === 'detail' && state.furthest < 5) return;
    const step = CHECKPOINT_STEP[checkpoint];
    if (step > state.furthest) setState((s) => ({ ...s, furthest: step }));
  }, [checkpoint, state.active, state.furthest]);

  const report = useCallback((c: Checkpoint | null) => setCheckpoint(c), []);
  const start = () => setState({ active: true, furthest: 0, dismissed: true });
  const exit = (completed = false) => setState((s) => ({ ...s, active: false, furthest: completed ? 0 : s.furthest, dismissed: true }));
  const dismissBanner = () => setState((s) => ({ ...s, dismissed: true }));

  return <Ctx.Provider value={{ ...state, checkpoint, start, exit, dismissBanner, report }}>{children}</Ctx.Provider>;
}

export function useGuide() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useGuide outside GuideProvider');
  return c;
}

/** Report this page's position in the complaint flow while it is mounted. */
export function useGuideCheckpoint(c: Checkpoint | null) {
  const { report } = useGuide();
  useEffect(() => {
    report(c);
    return () => report(null);
  }, [c, report]);
}

/** Start the guide from anywhere: it always begins on the home page. */
export function useStartGuide() {
  const { start } = useGuide();
  const navigate = useNavigate();
  return () => {
    start();
    navigate('/');
  };
}
