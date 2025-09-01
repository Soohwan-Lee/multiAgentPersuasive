import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database Types
export interface Participant {
  id: string;
  prolific_pid: string;
  study_id: string;
  session_id: string;
  condition_type: 'majority' | 'minority' | 'minorityDiffusion';
  task_order: 'informativeFirst' | 'normativeFirst';
  informative_task_index: number;
  normative_task_index: number;
  created_at: string;
  finished_at: string | null;
  browser_info?: any;
  device_info?: any;
}

export interface BackgroundSurvey {
  id: string;
  participant_id: string;
  age: number;
  gender: string;
  education: string;
  occupation?: string;
  political_views?: string;
  social_media_usage?: string;
  created_at: string;
}

export interface Session {
  id: string;
  participant_id: string;
  session_key: 'test' | 'normative' | 'informative';
  session_order: number;
  task_content: string;
  task_type: 'test' | 'normative' | 'informative';
  task_index?: number;
  started_at: string;
  completed_at?: string;
  current_turn: number;
  current_response: number;
  current_cycle: number;
}

export interface T0Response {
  id: string;
  participant_id: string;
  session_id: string;
  opinion: number;
  confidence: number;
  response_time_ms: number;
  created_at: string;
}

export interface Message {
  id: string;
  participant_id: string;
  session_id: string;
  cycle: number;
  role: 'user' | 'agent1' | 'agent2' | 'agent3';
  content: string;
  latency_ms?: number;
  token_in?: number;
  token_out?: number;
  fallback_used: boolean;
  created_at: string;
}

export interface TurnResponse {
  id: string;
  participant_id: string;
  session_id: string;
  cycle: number;
  response_index: number;
  opinion: number;
  confidence: number;
  response_time_ms: number;
  created_at: string;
}

export interface PostSelfSurvey {
  id: string;
  participant_id: string;
  session_id: string;
  survey_number: 1 | 2;
  
  // Perceived Compliance
  perceived_compliance_1: number;
  perceived_compliance_2: number;
  perceived_compliance_3: number;
  perceived_compliance_4: number;
  
  // Perceived Conversion
  perceived_conversion_1: number;
  perceived_conversion_2: number;
  perceived_conversion_3: number;
  perceived_conversion_4: number;
  
  // AI Agent Perception (majority condition)
  agent_competence?: number;
  agent_predictability?: number;
  agent_integrity?: number;
  agent_understanding?: number;
  agent_utility?: number;
  agent_affect?: number;
  agent_trust?: number;
  
  // AI Agent Perception (minority/minorityDiffusion conditions)
  agent1_competence?: number;
  agent1_predictability?: number;
  agent1_integrity?: number;
  agent1_understanding?: number;
  agent1_utility?: number;
  agent1_affect?: number;
  agent1_trust?: number;
  
  agent3_competence?: number;
  agent3_predictability?: number;
  agent3_integrity?: number;
  agent3_understanding?: number;
  agent3_utility?: number;
  agent3_affect?: number;
  agent3_trust?: number;
  
  // Concentration test
  concentration_test: number;
  
  created_at: string;
}

export interface PostOpenSurvey {
  id: string;
  participant_id: string;
  session_id: string;
  survey_number: 1 | 2;
  thoughts_on_experiment?: string;
  agent_comparison?: string;
  suggestions?: string;
  created_at: string;
}

export interface Event {
  id: string;
  participant_id: string;
  event_type: string;
  payload?: any;
  created_at: string;
}

// Database Functions

// 1. Participant Management
export async function createParticipant(data: {
  prolific_pid: string;
  study_id: string;
  session_id: string;
  condition_type: 'majority' | 'minority' | 'minorityDiffusion';
  task_order: 'informativeFirst' | 'normativeFirst';
  informative_task_index: number;
  normative_task_index: number;
  browser_info?: any;
  device_info?: any;
}): Promise<Participant | null> {
  const { data: participant, error } = await supabase
    .from('participants')
    .insert([data])
    .select()
    .single();

  if (error) {
    console.error('Error creating participant:', error);
    return null;
  }

  return participant;
}

export async function getParticipant(participantId: string): Promise<Participant | null> {
  const { data: participant, error } = await supabase
    .from('participants')
    .select('*')
    .eq('id', participantId)
    .single();

  if (error) {
    console.error('Error fetching participant:', error);
    return null;
  }

  return participant;
}

export async function updateParticipantFinished(participantId: string): Promise<void> {
  const { error } = await supabase
    .from('participants')
    .update({ finished_at: new Date().toISOString() })
    .eq('id', participantId);

  if (error) {
    console.error('Error updating participant finished time:', error);
  }
}

// 2. Background Survey
export async function saveBackgroundSurvey(data: {
  participant_id: string;
  age: number;
  gender: string;
  education: string;
  occupation?: string;
  political_views?: string;
  social_media_usage?: string;
}): Promise<BackgroundSurvey | null> {
  const { data: survey, error } = await supabase
    .from('background_surveys')
    .insert([data])
    .select()
    .single();

  if (error) {
    console.error('Error saving background survey:', error);
    return null;
  }

  return survey;
}

// 3. Session Management
export async function createSession(data: {
  participant_id: string;
  session_key: 'test' | 'normative' | 'informative';
  session_order: number;
  task_content: string;
  task_type: 'test' | 'normative' | 'informative';
  task_index?: number;
}): Promise<Session | null> {
  const { data: session, error } = await supabase
    .from('sessions')
    .insert([data])
    .select()
    .single();

  if (error) {
    console.error('Error creating session:', error);
    return null;
  }

  return session;
}

export async function getSession(sessionId: string): Promise<Session | null> {
  const { data: session, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error) {
    console.error('Error fetching session:', error);
    return null;
  }

  return session;
}

export async function getParticipantSessions(participantId: string): Promise<Session[]> {
  const { data: sessions, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('participant_id', participantId)
    .order('session_order', { ascending: true });

  if (error) {
    console.error('Error fetching participant sessions:', error);
    return [];
  }

  return sessions || [];
}

export async function updateSessionState(sessionId: string, updates: {
  current_turn?: number;
  current_response?: number;
  current_cycle?: number;
  completed_at?: string;
}): Promise<void> {
  const { error } = await supabase
    .from('sessions')
    .update(updates)
    .eq('id', sessionId);

  if (error) {
    console.error('Error updating session state:', error);
  }
}

// 4. T0 Responses
export async function saveT0Response(data: {
  participant_id: string;
  session_id: string;
  opinion: number;
  confidence: number;
  response_time_ms: number;
}): Promise<T0Response | null> {
  const { data: response, error } = await supabase
    .from('t0_responses')
    .insert([data])
    .select()
    .single();

  if (error) {
    console.error('Error saving T0 response:', error);
    return null;
  }

  return response;
}

export async function getT0Response(sessionId: string): Promise<T0Response | null> {
  const { data: response, error } = await supabase
    .from('t0_responses')
    .select('*')
    .eq('session_id', sessionId)
    .single();

  if (error) {
    console.error('Error fetching T0 response:', error);
    return null;
  }

  return response;
}

// 5. Messages
export async function saveMessage(data: {
  participant_id: string;
  session_id: string;
  cycle: number;
  role: 'user' | 'agent1' | 'agent2' | 'agent3';
  content: string;
  latency_ms?: number;
  token_in?: number;
  token_out?: number;
  fallback_used?: boolean;
}): Promise<Message | null> {
  const { data: message, error } = await supabase
    .from('messages')
    .insert([data])
    .select()
    .single();

  if (error) {
    console.error('Error saving message:', error);
    return null;
  }

  return message;
}

export async function getSessionMessages(sessionId: string): Promise<Message[]> {
  const { data: messages, error } = await supabase
    .from('messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('cycle', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching session messages:', error);
    return [];
  }

  return messages || [];
}

// 6. Turn Responses
export async function saveTurnResponse(data: {
  participant_id: string;
  session_id: string;
  cycle: number;
  response_index: number;
  opinion: number;
  confidence: number;
  response_time_ms: number;
}): Promise<TurnResponse | null> {
  const { data: response, error } = await supabase
    .from('turn_responses')
    .insert([data])
    .select()
    .single();

  if (error) {
    console.error('Error saving turn response:', error);
    return null;
  }

  return response;
}

export async function getSessionTurnResponses(sessionId: string): Promise<TurnResponse[]> {
  const { data: responses, error } = await supabase
    .from('turn_responses')
    .select('*')
    .eq('session_id', sessionId)
    .order('cycle', { ascending: true });

  if (error) {
    console.error('Error fetching session turn responses:', error);
    return [];
  }

  return responses || [];
}

// 7. Post-Self Surveys
export async function savePostSelfSurvey(data: {
  participant_id: string;
  session_id: string;
  survey_number: 1 | 2;
  perceived_compliance_1: number;
  perceived_compliance_2: number;
  perceived_compliance_3: number;
  perceived_compliance_4: number;
  perceived_conversion_1: number;
  perceived_conversion_2: number;
  perceived_conversion_3: number;
  perceived_conversion_4: number;
  concentration_test: number;
  // Majority condition fields
  agent_competence?: number;
  agent_predictability?: number;
  agent_integrity?: number;
  agent_understanding?: number;
  agent_utility?: number;
  agent_affect?: number;
  agent_trust?: number;
  // Minority condition fields
  agent1_competence?: number;
  agent1_predictability?: number;
  agent1_integrity?: number;
  agent1_understanding?: number;
  agent1_utility?: number;
  agent1_affect?: number;
  agent1_trust?: number;
  agent3_competence?: number;
  agent3_predictability?: number;
  agent3_integrity?: number;
  agent3_understanding?: number;
  agent3_utility?: number;
  agent3_affect?: number;
  agent3_trust?: number;
}): Promise<PostSelfSurvey | null> {
  const { data: survey, error } = await supabase
    .from('post_self_surveys')
    .insert([data])
    .select()
    .single();

  if (error) {
    console.error('Error saving post-self survey:', error);
    return null;
  }

  return survey;
}

// 8. Post-Open Surveys
export async function savePostOpenSurvey(data: {
  participant_id: string;
  session_id: string;
  survey_number: 1 | 2;
  thoughts_on_experiment?: string;
  agent_comparison?: string;
  suggestions?: string;
}): Promise<PostOpenSurvey | null> {
  const { data: survey, error } = await supabase
    .from('post_open_surveys')
    .insert([data])
    .select()
    .single();

  if (error) {
    console.error('Error saving post-open survey:', error);
    return null;
  }

  return survey;
}

// 9. Events
export async function saveEvent(data: {
  participant_id: string;
  event_type: string;
  payload?: any;
}): Promise<Event | null> {
  const { data: event, error } = await supabase
    .from('events')
    .insert([data])
    .select()
    .single();

  if (error) {
    console.error('Error saving event:', error);
    return null;
  }

  return event;
}

// 10. Utility Functions
export async function getParticipantCompleteData(participantId: string) {
  const participant = await getParticipant(participantId);
  if (!participant) return null;

  const sessions = await getParticipantSessions(participantId);
  const backgroundSurvey = await supabase
    .from('background_surveys')
    .select('*')
    .eq('participant_id', participantId)
    .single();

  const completeData = {
    participant,
    sessions: await Promise.all(
      sessions.map(async (session) => {
        const t0Response = await getT0Response(session.id);
        const messages = await getSessionMessages(session.id);
        const turnResponses = await getSessionTurnResponses(session.id);
        const postSelfSurvey = await supabase
          .from('post_self_surveys')
          .select('*')
          .eq('session_id', session.id)
          .single();
        const postOpenSurvey = await supabase
          .from('post_open_surveys')
          .select('*')
          .eq('session_id', session.id)
          .single();

        return {
          ...session,
          t0Response: t0Response?.data || null,
          messages: messages || [],
          turnResponses: turnResponses || [],
          postSelfSurvey: postSelfSurvey?.data || null,
          postOpenSurvey: postOpenSurvey?.data || null,
        };
      })
    ),
    backgroundSurvey: backgroundSurvey?.data || null,
  };

  return completeData;
}
