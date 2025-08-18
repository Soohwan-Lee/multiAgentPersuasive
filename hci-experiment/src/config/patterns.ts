import type { Stance } from "./agents";

export type SessionKey = "test" | "main1" | "main2";
export type PatternKey = "majority" | "minority" | "minorityDiffusion";

export interface PatternConfig {
  key: PatternKey;
  minorityAgentId?: 1 | 2 | 3;                // default 1
  consistency: Record<1 | 2 | 3, number>;     // 0..1
}

export const DEFAULT_PATTERN: Record<PatternKey, PatternConfig> = {
  majority: { 
    key: "majority", 
    consistency: { 1: 0.95, 2: 0.95, 3: 0.95 } 
  },
  minority: { 
    key: "minority", 
    minorityAgentId: 3, 
    consistency: { 1: 0.9, 2: 0.9, 3: 0.95 } 
  },
  minorityDiffusion: { 
    key: "minorityDiffusion", 
    minorityAgentId: 3, 
    consistency: { 1: 0.9, 2: 0.9, 3: 0.95 } 
  }
};

/** Initial stance from T0 slider */
export function stanceFromT0(x: number): Stance {
  if (x > 0) return "support";
  if (x < 0) return "oppose";
  return "neutral";
}

/** Return stances for agents (1..3) for the given chatCycle (1..4). */
export function resolveStances(opts: {
  pattern: PatternKey;
  initial: Stance;           // from T0
  session: SessionKey;       // used downstream for style bias (not for stance)
  chatCycle: 1 | 2 | 3 | 4;
}): Record<1 | 2 | 3, Stance> {
  const opposite = (s: Stance): Stance => s === "support" ? "oppose" : s === "oppose" ? "support" : "oppose";
  
  if (opts.pattern === "majority") {
    const m = opposite(opts.initial || "neutral");
    return { 1: m, 2: m, 3: m };
  }
  
  if (opts.pattern === "minority") {
    const minority = opposite(opts.initial || "neutral");
    const majority = opts.initial || "neutral";
    return { 1: majority, 2: majority, 3: minority };
  }
  
  // minorityDiffusion
  const minority = opposite(opts.initial || "neutral");
  const majority = opts.initial || "neutral";
  
  if (opts.chatCycle <= 2) {
    // C1, C2: A1/A2 = majority, A3 = minority
    return { 1: majority, 2: majority, 3: minority };
  } else if (opts.chatCycle === 3) {
    // C3 (before generating replies): Agent 1 flips to minority
    return { 1: minority, 2: majority, 3: minority };
  } else {
    // C4: Agent 2 also flips to minority
    return { 1: minority, 2: minority, 3: minority };
  }
}

/** decide stances for (Agent 1..3) given pattern and initial t0 stance */
export function stancesForTurn(opts: {
  pattern: PatternConfig;
  initial: Stance;           // derived from t0 slider
  session: SessionKey;       // shape style downstream (normative vs informative)
  turnIndex: number;         // 0..3 (turn cycles), t0 handled separately
}): Record<1 | 2 | 3, Stance> {
  return resolveStances({
    pattern: opts.pattern.key,
    initial: opts.initial,
    session: opts.session,
    chatCycle: (opts.turnIndex + 1) as 1 | 2 | 3 | 4
  });
}
