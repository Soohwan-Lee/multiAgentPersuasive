import { AGENTS, Stance } from "@/config/agents";
import { DEFAULT_PATTERN, resolveStances, stanceFromT0, SessionKey } from "@/config/patterns";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/prompts";
import { callOpenAIChat } from "@/lib/llm-openai";
import { FALLBACK } from "@/lib/fallbacks";
import { supabase } from "@/lib/supabase";

export async function runCycle(opts: {
  participantId: string;
  sessionKey: SessionKey;            // 'test'|'main1'|'main2'
  cycle: number;                     // 1..4 (chat cycles)
  userMessage: string;
}) {
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

  const initial: Stance = stanceFromT0(t0Response.opinion);
  const patternKey = participant?.condition as "majority" | "minority" | "minorityDiffusion" || "majority";

  // 2) resolve stances for this cycle
  const stances = resolveStances({ 
    pattern: patternKey, 
    initial, 
    session: opts.sessionKey, 
    chatCycle: opts.cycle as 1 | 2 | 3 | 4 
  });

  // 3) build prompts + call OpenAI sequentially
  const results = [];
  
  for (const agent of AGENTS) {
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
    });

    const r = await callOpenAIChat({ system, user });
    const text = r.timedOut ? FALLBACK[stances[agent.id as 1 | 2 | 3]] : r.text || FALLBACK[stances[agent.id as 1 | 2 | 3]];
    
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

  return {
    agents: {
      agent1: results.find(r => r.agentId === 1)!.text,
      agent2: results.find(r => r.agentId === 2)!.text,
      agent3: results.find(r => r.agentId === 3)!.text,
    },
    meta: {
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
