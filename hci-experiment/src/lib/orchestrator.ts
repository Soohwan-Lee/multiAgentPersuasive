import { AGENTS, Stance } from "@/config/agents";
import { DEFAULT_PATTERN, stancesForTurn, SessionKey } from "@/config/patterns";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/prompts";
import { callOpenAIChat } from "@/lib/llm-openai";
import { FALLBACK } from "@/lib/fallbacks";
import { supabase } from "@/lib/supabase";

function stanceFromT0(x: number): Stance {
  if (x > 0) return "support";
  if (x < 0) return "oppose";
  return "neutral";
}

export async function runTurn(opts: {
  participantId: string;
  sessionKey: SessionKey;            // 'test'|'main1'|'main2'
  turnIndex: number;                 // 0..3 cycles after t0
  userMessage: string;
}) {
  // 1) load participant, t0, pattern
  const { data: participant } = await supabase
    .from('participants')
    .select('*')
    .eq('id', opts.participantId)
    .single();

  if (!participant) {
    throw new Error('Participant not found');
  }

  const patternKey = participant?.condition === "minority" ? "minority" : "majority";
  const pattern = DEFAULT_PATTERN[patternKey];

  // Get t0 response for this session
  const { data: t0row } = await supabase
    .from('turns')
    .select('*')
    .eq('participant_id', opts.participantId)
    .eq('session_key', opts.sessionKey)
    .eq('t_idx', 0)
    .single();

  const initial: Stance = stanceFromT0(t0row?.public_choice ?? 0);

  // 2) resolve stances for this turn
  const stances = stancesForTurn({ pattern, initial, session: opts.sessionKey, turnIndex: opts.turnIndex });

  // 3) build prompts + call OpenAI in parallel
  const calls = AGENTS.map(async (a) => {
    const system = buildSystemPrompt({
      agentId: a.id as 1 | 2 | 3,
      agentName: a.name,
      sessionKey: opts.sessionKey,
      turnIndex: opts.turnIndex,
      participantPublicStance: undefined,
      participantMessage: opts.userMessage,
      stance: stances[a.id as 1 | 2 | 3],
      consistency: pattern.consistency[a.id as 1 | 2 | 3],
      locale: "en",
    });
    const user = buildUserPrompt({
      agentId: a.id as 1 | 2 | 3,
      agentName: a.name,
      sessionKey: opts.sessionKey,
      turnIndex: opts.turnIndex,
      participantPublicStance: undefined,
      participantMessage: opts.userMessage,
      stance: stances[a.id as 1 | 2 | 3],
      consistency: pattern.consistency[a.id as 1 | 2 | 3],
      locale: "en",
    });

    const r = await callOpenAIChat({ system, user });
    const text = r.timedOut ? FALLBACK[stances[a.id as 1 | 2 | 3]] : r.text || FALLBACK[stances[a.id as 1 | 2 | 3]];
    return { 
      agentId: a.id, 
      text, 
      latencyMs: r.latencyMs, 
      tokenIn: r.tokenIn, 
      tokenOut: r.tokenOut, 
      fallback_used: r.timedOut || !r.text 
    };
  });

  const results = await Promise.all(calls);

  // 4) persist: upsert turn (idempotent), insert 3 messages
  const turnId = crypto.randomUUID();
  const { error: turnError } = await supabase
    .from('turns')
    .upsert({
      id: turnId,
      participant_id: opts.participantId,
      session_key: opts.sessionKey,
      t_idx: opts.turnIndex,
      user_msg: opts.userMessage,
    }, { onConflict: 'participant_id,session_key,t_idx' });

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
        t_idx: opts.turnIndex,
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
