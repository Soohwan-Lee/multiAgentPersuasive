export interface Participant {
  id: string;
  prolific_pid: string;
  study_id: string;
  session_id: string;
  condition: string | null;
  created_at: string;
  finished_at: string | null;
}

export interface Session {
  id: string;
  participant_id: string;
  key: 'test' | 'main1' | 'main2';
  started_at: string;
  completed_at: string | null;
  current_turn: number;
}

export interface Turn {
  id: string;
  participant_id: string;
  session_key: string;
  t_idx: number;
  user_msg: string | null;
  public_choice: number | null;
  public_conf: number | null;
  private_belief: number | null;
  private_conf: number | null;
  rt_ms: number | null;
  created_at: string;
}

export interface Message {
  id: string;
  participant_id: string;
  session_key: string;
  t_idx: number;
  role: 'user' | 'agent1' | 'agent2' | 'agent3';
  content: string;
  latency_ms: number | null;
  token_in: number | null;
  token_out: number | null;
  fallback_used: boolean;
  ts: string;
}

export interface Event {
  id: string;
  participant_id: string;
  type: string;
  payload: any;
  ts: string;
}

export interface AgentResponse {
  content: string;
  latency_ms: number;
  token_in?: number;
  token_out?: number;
  fallback_used: boolean;
}

export interface TurnResponse {
  agent1: AgentResponse;
  agent2: AgentResponse;
  agent3: AgentResponse;
  meta: {
    turn_index: number;
    session_key: string;
    participant_id: string;
  };
}

export interface ParticipantState {
  participant: Participant;
  sessions: Session[];
  current_session: Session | null;
  last_completed_turn: Turn | null;
  last_messages: Message[];
}

export interface SurveyBackground {
  age: number;
  gender: string;
  education: string;
  occupation: string;
  political_views: string;
  social_media_usage: string;
}

export interface SurveyPostSelf {
  persuasion_effectiveness: number;
  agent_credibility: number;
  decision_confidence: number;
  overall_satisfaction: number;
}

export interface SurveyPostOpen {
  thoughts_on_experiment: string;
  agent_comparison: string;
  suggestions: string;
}
