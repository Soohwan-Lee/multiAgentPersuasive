import { create } from 'zustand';
import { Participant, Session, Turn, Message } from './types';

interface ExperimentStore {
  participant: Participant | null;
  currentSession: Session | null;
  currentTurn: Turn | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  
  setParticipant: (participant: Participant) => void;
  setCurrentSession: (session: Session) => void;
  setCurrentTurn: (turn: Turn) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useExperimentStore = create<ExperimentStore>((set) => ({
  participant: null,
  currentSession: null,
  currentTurn: null,
  messages: [],
  isLoading: false,
  error: null,
  
  setParticipant: (participant) => set({ participant }),
  setCurrentSession: (session) => set({ currentSession: session }),
  setCurrentTurn: (turn) => set({ currentTurn: turn }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ 
    messages: [...state.messages, message] 
  })),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  reset: () => set({ 
    participant: null, 
    currentSession: null, 
    currentTurn: null, 
    messages: [], 
    isLoading: false, 
    error: null 
  }),
}));
