import type { Stance } from "./agents";

export type SessionKey = "test" | "main1" | "main2";
export interface PatternConfig {
  key: "majority" | "minority";
  minorityAgentId?: 1 | 2 | 3;                // default 1
  consistency: Record<1 | 2 | 3, number>;     // 0..1
}

export const DEFAULT_PATTERN: Record<"majority" | "minority", PatternConfig> = {
  majority: { key: "majority", consistency: { 1: 0.95, 2: 0.95, 3: 0.95 } },
  minority: { key: "minority", minorityAgentId: 1, consistency: { 1: 0.95, 2: 0.9, 3: 0.9 } }
};

/** decide stances for (Agent 1..3) given pattern and initial t0 stance */
export function stancesForTurn(opts: {
  pattern: PatternConfig;
  initial: Stance;           // derived from t0 slider
  session: SessionKey;       // shape style downstream (normative vs informative)
  turnIndex: number;         // 0..3 (turn cycles), t0 handled separately
}): Record<1 | 2 | 3, Stance> {
  const minorityId = opts.pattern.minorityAgentId ?? 1;
  const opposite = (s: Stance): Stance => s === "support" ? "oppose" : s === "oppose" ? "support" : "oppose";
  
  if (opts.pattern.key === "majority") {
    const m = opposite(opts.initial || "neutral");
    return { 1: m, 2: m, 3: m };
  } else {
    const minority = opposite(opts.initial || "neutral");
    const majority = opts.initial || "neutral";
    return {
      1: (minorityId === 1 ? minority : majority),
      2: (minorityId === 2 ? minority : majority),
      3: (minorityId === 3 ? minority : majority),
    };
  }
}
