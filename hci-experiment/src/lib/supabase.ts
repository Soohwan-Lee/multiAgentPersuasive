import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 디버깅을 위한 환경변수 로깅
console.log('Supabase URL:', supabaseUrl ? 'Set' : 'Not Set');
console.log('Supabase Anon Key:', supabaseAnonKey ? 'Set' : 'Not Set');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl);
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database Types
export interface Participant {
  id: string;
  prolific_pid: string;
  study_id: string;
  session_id: string;
  participant_no?: number; // experiment_conditions.id
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
  cycle: number | null; // null for T0
  response_index: 0;    // T0
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

export interface ExperimentCondition {
  id: number;
  condition_type: 'majority' | 'minority' | 'minorityDiffusion';
  task_order: 'informativeFirst' | 'normativeFirst';
  informative_task_index: number;
  normative_task_index: number;
  is_assigned: boolean;
  assigned_participant_id?: string;
  assigned_at?: string;
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
  // Insert only columns that exist in the minimal schema
  const insertPayload = {
    prolific_pid: data.prolific_pid,
    study_id: data.study_id,
    session_id: data.session_id,
    condition_type: data.condition_type,
    task_order: data.task_order,
    informative_task_index: data.informative_task_index,
    normative_task_index: data.normative_task_index,
  };

  const { data: participant, error } = await supabase
    .from('participants')
    .insert([insertPayload])
    .select()
    .single();

  if (error) {
    console.error('Error creating participant:', error);
    return null;
  }

  return participant;
}

export async function getParticipant(prolificPidOrId: string): Promise<Participant | null> {
  // Try by prolific_pid first
  const byProlific = await supabase
    .from('participants')
    .select('*')
    .eq('prolific_pid', prolificPidOrId)
    .single();

  if (byProlific.data) return byProlific.data as Participant;
  if (byProlific.error && byProlific.error.code && byProlific.error.code !== 'PGRST116') {
    console.error('Error fetching participant by prolific_pid:', byProlific.error);
    return null;
  }

  // If the input looks like a UUID, try by id
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(prolificPidOrId)) {
    return null;
  }

  const byId = await supabase
    .from('participants')
    .select('*')
    .eq('id', prolificPidOrId)
    .single();

  if (byId.error) {
    console.error('Error fetching participant by id:', byId.error);
    return null;
  }

  return byId.data as Participant;
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
  // fetch participant to enrich with condition info and participant_no
  const { data: p } = await supabase
    .from('participants')
    .select('*')
    .eq('id', data.participant_id)
    .single();

  const { data: ec } = p ? await supabase
    .from('experiment_conditions')
    .select('*')
    .eq('assigned_participant_id', p.id)
    .single() : { data: null } as any;

  const payload = {
    participant_id: data.participant_id,
    participant_no: p?.participant_no ?? null,
    condition_id: ec?.id ?? null,
    condition_type: p?.condition_type ?? null,
    task_order: p?.task_order ?? null,
    age: data.age,
    gender: data.gender,
    education: data.education,
    occupation: data.occupation ?? null,
    political_views: data.political_views ?? null,
    social_media_usage: data.social_media_usage ?? null,
  };

  const { data: survey, error } = await supabase
    .from('background_surveys')
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error('Error saving background survey:', error);
    return null;
  }

  return survey as unknown as BackgroundSurvey;
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
  const payload = {
    participant_id: data.participant_id,
    session_id: data.session_id,
    cycle: null as number | null,
    response_index: 0 as 0,
    opinion: data.opinion,
    confidence: data.confidence,
    response_time_ms: data.response_time_ms,
  };

  const { data: response, error } = await supabase
    .from('turn_responses')
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error('Error saving T0 response:', error);
    return null;
  }

  return response as unknown as T0Response;
}

export async function getT0Response(sessionId: string): Promise<T0Response | null> {
  const { data: response, error } = await supabase
    .from('turn_responses')
    .select('*')
    .eq('session_id', sessionId)
    .eq('response_index', 0)
    .single();

  if (error) {
    console.error('Error fetching T0 response:', error);
    return null;
  }

  return response as unknown as T0Response;
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
    .gt('response_index', 0)
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
  const { data: p } = await supabase
    .from('participants')
    .select('*')
    .eq('id', data.participant_id)
    .single();

  const { data: ec } = p ? await supabase
    .from('experiment_conditions')
    .select('*')
    .eq('assigned_participant_id', p.id)
    .single() : { data: null } as any;

  const payload = {
    participant_id: data.participant_id,
    participant_no: p?.participant_no ?? null,
    condition_id: ec?.id ?? null,
    condition_type: p?.condition_type ?? null,
    task_order: p?.task_order ?? null,
    task_type: (p?.task_order === 'informativeFirst' ? (data.survey_number === 1 ? 'informative' : 'normative') : (data.survey_number === 1 ? 'normative' : 'informative')) as 'informative'|'normative',
    survey_number: data.survey_number,
    perceived_compliance_1: data.perceived_compliance_1,
    perceived_compliance_2: data.perceived_compliance_2,
    perceived_compliance_3: data.perceived_compliance_3,
    perceived_compliance_4: data.perceived_compliance_4,
    perceived_conversion_1: data.perceived_conversion_1,
    perceived_conversion_2: data.perceived_conversion_2,
    perceived_conversion_3: data.perceived_conversion_3,
    perceived_conversion_4: data.perceived_conversion_4,
    concentration_test: data.concentration_test,
    agent_competence: data.agent_competence ?? null,
    agent_predictability: data.agent_predictability ?? null,
    agent_integrity: data.agent_integrity ?? null,
    agent_understanding: data.agent_understanding ?? null,
    agent_utility: data.agent_utility ?? null,
    agent_affect: data.agent_affect ?? null,
    agent_trust: data.agent_trust ?? null,
    agent1_competence: data.agent1_competence ?? null,
    agent1_predictability: data.agent1_predictability ?? null,
    agent1_integrity: data.agent1_integrity ?? null,
    agent1_understanding: data.agent1_understanding ?? null,
    agent1_utility: data.agent1_utility ?? null,
    agent1_affect: data.agent1_affect ?? null,
    agent1_trust: data.agent1_trust ?? null,
    agent3_competence: data.agent3_competence ?? null,
    agent3_predictability: data.agent3_predictability ?? null,
    agent3_integrity: data.agent3_integrity ?? null,
    agent3_understanding: data.agent3_understanding ?? null,
    agent3_utility: data.agent3_utility ?? null,
    agent3_affect: data.agent3_affect ?? null,
    agent3_trust: data.agent3_trust ?? null,
  };

  const { data: survey, error } = await supabase
    .from('post_self_surveys')
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error('Error saving post-self survey:', error);
    return null;
  }

  return survey as unknown as PostSelfSurvey;
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
  const { data: p } = await supabase
    .from('participants')
    .select('*')
    .eq('id', data.participant_id)
    .single();

  const { data: ec } = p ? await supabase
    .from('experiment_conditions')
    .select('*')
    .eq('assigned_participant_id', p.id)
    .single() : { data: null } as any;

  const payload = {
    participant_id: data.participant_id,
    participant_no: p?.participant_no ?? null,
    condition_id: ec?.id ?? null,
    condition_type: p?.condition_type ?? null,
    task_order: p?.task_order ?? null,
    task_type: (p?.task_order === 'informativeFirst' ? (data.survey_number === 1 ? 'informative' : 'normative') : (data.survey_number === 1 ? 'normative' : 'informative')) as 'informative'|'normative',
    survey_number: data.survey_number,
    thoughts_on_experiment: data.thoughts_on_experiment ?? null,
    agent_comparison: data.agent_comparison ?? null,
    suggestions: data.suggestions ?? null,
  };

  const { data: survey, error } = await supabase
    .from('post_open_surveys')
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error('Error saving post-open survey:', error);
    return null;
  }

  return survey as unknown as PostOpenSurvey;
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
          t0Response: t0Response || null,
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

// 11. Experiment Condition Management
export async function getNextAvailableCondition(): Promise<ExperimentCondition | null> {
  const { data: condition, error } = await supabase
    .from('experiment_conditions')
    .select('*')
    .eq('is_assigned', false)
    .order('id', { ascending: true })
    .limit(1)
    .single();

  if (error) {
    console.error('Error fetching next available condition:', error);
    return null;
  }

  return condition;
}

// 원자적 조건 배정 함수 (동시성 문제 해결)
export async function assignNextConditionAtomic(participantId: string): Promise<ExperimentCondition | null> {
  const { data, error } = await supabase.rpc('assign_next_condition', {
    p_participant_id: participantId
  });

  if (error) {
    console.error('Error assigning condition atomically:', error);
    return null;
  }

  if (!data || data.length === 0) {
    console.log('No available conditions for assignment');
    return null;
  }

  const condition = data[0];
  return {
    id: condition.condition_id,
    condition_type: condition.condition_type,
    task_order: condition.task_order,
    informative_task_index: condition.informative_task_index,
    normative_task_index: condition.normative_task_index,
    is_assigned: true,
    assigned_participant_id: participantId,
    assigned_at: new Date().toISOString(),
    created_at: new Date().toISOString()
  };
}

export async function assignConditionToParticipant(conditionId: number, participantId: string): Promise<boolean> {
  const { error } = await supabase
    .from('experiment_conditions')
    .update({
      is_assigned: true,
      assigned_participant_id: participantId,
      assigned_at: new Date().toISOString()
    })
    .eq('id', conditionId)
    .eq('is_assigned', false); // Ensure it's still unassigned

  if (error) {
    console.error('Error assigning condition to participant:', error);
    return false;
  }

  return true;
}

// 중도 이탈자 정리 함수
export async function cleanupAbandonedAssignments(): Promise<number> {
  const { data, error } = await supabase.rpc('cleanup_abandoned_assignments');

  if (error) {
    console.error('Error cleaning up abandoned assignments:', error);
    return 0;
  }

  return data || 0;
}

// 조건 배정 상태 조회 함수
export async function getConditionAssignmentStats(): Promise<{
  totalConditions: number;
  assignedConditions: number;
  availableConditions: number;
  completedParticipants: number;
  activeParticipants: number;
  abandonedParticipants: number;
} | null> {
  const { data, error } = await supabase.rpc('get_condition_stats');

  if (error) {
    console.error('Error fetching condition stats:', error);
    return null;
  }

  if (!data || data.length === 0) {
    return null;
  }

  const stats = data[0];
  return {
    totalConditions: stats.total_conditions,
    assignedConditions: stats.assigned_conditions,
    availableConditions: stats.available_conditions,
    completedParticipants: stats.completed_participants,
    activeParticipants: stats.active_participants,
    abandonedParticipants: stats.abandoned_participants
  };
}

export async function getParticipantCondition(participantId: string): Promise<ExperimentCondition | null> {
  const { data: condition, error } = await supabase
    .from('experiment_conditions')
    .select('*')
    .eq('assigned_participant_id', participantId)
    .single();

  if (error) {
    console.error('Error fetching participant condition:', error);
    return null;
  }

  return condition;
}

export async function getConditionStatistics(): Promise<{
  total: number;
  assigned: number;
  unassigned: number;
  byCondition: Record<string, number>;
  byOrder: Record<string, number>;
} | null> {
  // Get total counts
  const { count: total } = await supabase
    .from('experiment_conditions')
    .select('*', { count: 'exact', head: true });

  const { count: assigned } = await supabase
    .from('experiment_conditions')
    .select('*', { count: 'exact', head: true })
    .eq('is_assigned', true);

  // Get counts by condition type
  const { data: conditionCounts } = await supabase
    .from('experiment_conditions')
    .select('condition_type, is_assigned')
    .eq('is_assigned', true);

  // Get counts by task order
  const { data: orderCounts } = await supabase
    .from('experiment_conditions')
    .select('task_order, is_assigned')
    .eq('is_assigned', true);

  if (total === null || assigned === null) {
    return null;
  }

  const byCondition: Record<string, number> = {};
  const byOrder: Record<string, number> = {};

  // Process condition counts
  conditionCounts?.forEach(row => {
    byCondition[row.condition_type] = (byCondition[row.condition_type] || 0) + 1;
  });

  // Process order counts
  orderCounts?.forEach(row => {
    byOrder[row.task_order] = (byOrder[row.task_order] || 0) + 1;
  });

  return {
    total,
    assigned,
    unassigned: total - assigned,
    byCondition,
    byOrder
  };
}
