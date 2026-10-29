import { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react';
import type {
  CitizenVerification,
  Complaint,
  ComplaintDraft,
  ComplaintStatus,
  StatusSource,
  TimelineStage,
} from '../data/types';
import { SEED_COMPLAINTS } from '../data/complaints';
import { clearAll, load, save } from '../lib/storage';

export const EMPTY_DRAFT: ComplaintDraft = {
  title: '',
  category: '',
  description: '',
  complaintText: '',
  state: 'Haryana',
  city: 'Faridabad',
  localityId: '',
  ward: '',
  pin: '',
  landmark: '',
  coordinates: '',
  incidentDate: '',
  departmentId: '',
  serviceId: '',
  photoName: '',
  photoUrl: '',
};

interface State {
  complaints: Complaint[];
  draft: ComplaintDraft;
}

type Action =
  | { type: 'add'; complaint: Complaint }
  | { type: 'delete'; id: string }
  | {
      type: 'event';
      id: string;
      stage: TimelineStage;
      note: string;
      source: StatusSource;
      status?: ComplaintStatus;
      verification?: CitizenVerification;
    }
  | { type: 'removeEvent'; id: string; eventId: string }
  | { type: 'draft'; draft: ComplaintDraft }
  | { type: 'reset' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'add':
      return { ...state, complaints: [action.complaint, ...state.complaints] };
    case 'delete':
      return { ...state, complaints: state.complaints.filter((c) => c.id !== action.id) };
    case 'event': {
      const now = new Date().toISOString();
      return {
        ...state,
        complaints: state.complaints.map((c) => {
          if (c.id !== action.id) return c;
          return {
            ...c,
            status: action.status ?? c.status,
            statusSource: action.status ? action.source : c.statusSource,
            citizenVerification: action.verification ?? c.citizenVerification,
            lastUpdate: now,
            timeline: [
              ...c.timeline,
              {
                id: `${c.id}-u${Date.now()}`,
                stage: action.stage,
                date: now,
                note: action.note,
                source: action.source,
                removable: true,
                prevStatus: c.status,
                prevVerification: c.citizenVerification,
              },
            ],
          };
        }),
      };
    }
    case 'removeEvent':
      return {
        ...state,
        complaints: state.complaints.map((c) => {
          if (c.id !== action.id) return c;
          const ev = c.timeline.find((e) => e.id === action.eventId);
          if (!ev || !ev.removable) return c;
          const timeline = c.timeline.filter((e) => e.id !== action.eventId);
          return {
            ...c,
            timeline,
            status: ev.prevStatus ?? c.status,
            citizenVerification: ev.prevVerification ?? c.citizenVerification,
            lastUpdate: timeline[timeline.length - 1].date,
          };
        }),
      };
    case 'draft':
      return { ...state, draft: action.draft };
    case 'reset':
      return { complaints: SEED_COMPLAINTS, draft: EMPTY_DRAFT };
  }
}

interface StoreCtx extends State {
  dispatch: React.Dispatch<Action>;
}

const Ctx = createContext<StoreCtx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    complaints: load<Complaint[]>('complaints', SEED_COMPLAINTS),
    draft: { ...load<ComplaintDraft>('draft', EMPTY_DRAFT), photoUrl: '' },
  }));

  useEffect(() => save('complaints', state.complaints), [state.complaints]);
  // Photo previews are object URLs and only live for this page session.
  useEffect(() => save('draft', { ...state.draft, photoUrl: '' }), [state.draft]);

  return <Ctx.Provider value={{ ...state, dispatch }}>{children}</Ctx.Provider>;
}

export function useStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useStore outside StoreProvider');
  return c;
}

export function resetDemoData(dispatch: React.Dispatch<Action>) {
  clearAll();
  dispatch({ type: 'reset' });
}
