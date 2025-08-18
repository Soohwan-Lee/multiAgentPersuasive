import { AGENTS, Stance } from "@/config/agents";
import { DEFAULT_PATTERN, resolveStances, stanceFromT0, SessionKey, CURRENT_PATTERN } from "@/config/patterns";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/prompts";
import { callOpenAIChat } from "@/lib/llm-openai";
import { FALLBACK } from "@/lib/fallbacks";
import { supabase } from "@/lib/supabase";
import { Message } from "@/lib/types";

export async function runCycle(opts: {
  participantId: string;
  sessionKey: SessionKey;            // 'test'|'main1'|'main2'
  cycle: number;                     // 1..4 (chat cycles)
  userMessage: string;
}) {
  console.log(`=== Starting cycle ${opts.cycle} for session ${opts.sessionKey} ===`);
  console.log(`User message: "${opts.userMessage}"`);
  
  // 1) load participant and T0 response
  const { data: participant } = await supabase
    .from('participants')
    .select('*')
    .eq('id', opts.participantId)
    .single();

  if (!participant) {
    throw new Error('Participant not found');
  }

  // Get T0 response for this session
  const { data: t0Response } = await supabase
    .from('responses')
    .select('*')
    .eq('participant_id', opts.participantId)
    .eq('session_key', opts.sessionKey)
    .eq('response_index', 0)
    .single();

  if (!t0Response) {
    throw new Error('T0 response not found');
  }

  // Get previous messages for conversation context
  const { data: previousMessages } = await supabase
    .from('messages')
    .select('*')
    .eq('participant_id', opts.participantId)
    .eq('session_key', opts.sessionKey)
    .lt('cycle', opts.cycle)
    .order('cycle', { ascending: true })
    .order('ts', { ascending: true });

  console.log(`Found ${previousMessages?.length || 0} previous messages for context`);

  const initial: Stance = stanceFromT0(t0Response.opinion);
  // Use CURRENT_PATTERN for easy configuration
  const patternKey = CURRENT_PATTERN;
  
  console.log(`T0 opinion: ${t0Response.opinion} -> Initial stance: ${initial}`);
  console.log(`Current pattern: ${patternKey}`);

  // 2) resolve stances for this cycle
  const stances = resolveStances({ 
    pattern: patternKey, 
    initial, 
    session: opts.sessionKey, 
    chatCycle: opts.cycle as 1 | 2 | 3 | 4 
  });
  
  console.log(`Resolved stances for cycle ${opts.cycle}:`, stances);

  // 3) build prompts + call OpenAI sequentially
  const results = [];
  
  for (const agent of AGENTS) {
    console.log(`\n--- Generating response for ${agent.name} (Agent ${agent.id}) ---`);
    
    const system = buildSystemPrompt({
      agentId: agent.id as 1 | 2 | 3,
      agentName: agent.name,
      sessionKey: opts.sessionKey,
      turnIndex: opts.cycle - 1, // Convert cycle to turn index
      participantPublicStance: undefined,
      participantMessage: opts.userMessage,
      stance: stances[agent.id as 1 | 2 | 3],
      consistency: DEFAULT_PATTERN[patternKey].consistency[agent.id as 1 | 2 | 3],
      locale: "en",
      pattern: patternKey,
      chatCycle: opts.cycle,
    });
    
    const user = buildUserPrompt({
      agentId: agent.id as 1 | 2 | 3,
      agentName: agent.name,
      sessionKey: opts.sessionKey,
      turnIndex: opts.cycle - 1,
      participantPublicStance: undefined,
      participantMessage: opts.userMessage,
      stance: stances[agent.id as 1 | 2 | 3],
      consistency: DEFAULT_PATTERN[patternKey].consistency[agent.id as 1 | 2 | 3],
      locale: "en",
      pattern: patternKey,
      chatCycle: opts.cycle,
      previousMessages: previousMessages || [], // 이전 대화 기록 추가
    });

    console.log(`Agent ${agent.id} stance: ${stances[agent.id as 1 | 2 | 3]}`);
    console.log(`Agent ${agent.id} consistency: ${DEFAULT_PATTERN[patternKey].consistency[agent.id as 1 | 2 | 3]}`);

    const r = await callOpenAIChat({ system, user });
    const text = r.timedOut ? FALLBACK[stances[agent.id as 1 | 2 | 3]] : r.text || FALLBACK[stances[agent.id as 1 | 2 | 3]];
    
    console.log(`Agent ${agent.id} response: "${text.substring(0, 100)}..."`);
    console.log(`Agent ${agent.id} fallback used: ${r.timedOut || !r.text}`);
    
    results.push({ 
      agentId: agent.id, 
      text, 
      latencyMs: r.latencyMs, 
      tokenIn: r.tokenIn, 
      tokenOut: r.tokenOut, 
      fallback_used: r.timedOut || !r.text 
    });
  }

  // 4) persist: upsert turn (idempotent), insert 3 messages
  const turnId = crypto.randomUUID();
  const { error: turnError } = await supabase
    .from('turns')
    .upsert({
      id: turnId,
      participant_id: opts.participantId,
      session_key: opts.sessionKey,
      cycle: opts.cycle,
      user_msg: opts.userMessage,
    }, { onConflict: 'participant_id,session_key,cycle' });

  if (turnError) {
    console.error('Turn upsert error:', turnError);
  }

  // Insert agent messages
  for (const r of results) {
    await supabase
      .from('messages')
      .insert({
        id: crypto.randomUUID(),
        participant_id: opts.participantId,
        session_key: opts.sessionKey,
        cycle: opts.cycle,
        role: `agent${r.agentId}`,
        content: r.text,
        latency_ms: r.latencyMs,
        token_in: r.tokenIn ?? null,
        token_out: r.tokenOut ?? null,
        fallback_used: r.fallback_used,
      });
  }

  console.log(`=== Cycle ${opts.cycle} completed successfully ===\n`);

  return {
    agent1: { content: results.find(r => r.agentId === 1)!.text },
    agent2: { content: results.find(r => r.agentId === 2)!.text },
    agent3: { content: results.find(r => r.agentId === 3)!.text },
    meta: {
      cycle: opts.cycle,
      session_key: opts.sessionKey,
      participant_id: opts.participantId,
      stances,
      latencies: {
        agent1: results.find(r => r.agentId === 1)!.latencyMs,
        agent2: results.find(r => r.agentId === 2)!.latencyMs,
        agent3: results.find(r => r.agentId === 3)!.latencyMs,
      }
    }
  };
}

// Legacy function for backward compatibility
export async function runTurn(opts: {
  participantId: string;
  sessionKey: SessionKey;
  turnIndex: number;
  userMessage: string;
}) {
  return runCycle({
    participantId: opts.participantId,
    sessionKey: opts.sessionKey,
    cycle: opts.turnIndex + 1,
    userMessage: opts.userMessage,
  });
}
