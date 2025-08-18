import type { Stance } from "@/config/agents";

export interface PromptCtx {
  agentId: 1 | 2 | 3;
  agentName: string;
  sessionKey: "test" | "main1" | "main2";
  turnIndex: number;                 // 0..3 for post-t0 cycles
  participantPublicStance?: "support" | "oppose" | "neutral";
  participantMessage: string;
  stance: Stance;
  consistency: number;               // 0..1
  locale?: "en";                     // fixed English UI
  pattern?: "majority" | "minority" | "minorityDiffusion";
  chatCycle?: number;               // 1..4 for pattern-specific logic
}

const NORMATIVE_PRIMS = [
  "anticipated approval or disapproval by others",
  "fit with shared values or group identity",
  "reputational costs and social sanctions",
  "coordination and harmony considerations",
];

const INFORMATIVE_PRIMS = [
  "empirical evidence and base rates",
  "diagnosticity and alternative explanations",
  "uncertainty reduction and error costs",
  "long-term consequences and robustness",
];

export function buildSystemPrompt(ctx: PromptCtx) {
  const stanceLine =
    ctx.stance === "oppose"
      ? "You consistently oppose the user's position. You may soften tone only if the user provides multiple concrete pieces of evidence; however, keep the conclusion opposed."
      : ctx.stance === "support"
      ? "You consistently support the user's position. Emphasize pragmatic benefits and reasonable trade-offs."
      : "You remain neutral, clarifying criteria and highlighting uncertainties.";

  const conformityFocus = ctx.sessionKey === "main1"
    ? `When selecting arguments, prefer NORMATIVE cues: ${NORMATIVE_PRIMS.join(", ")}.`
    : ctx.sessionKey === "main2"
    ? `When selecting arguments, prefer INFORMATIVE cues: ${INFORMATIVE_PRIMS.join(", ")}.`
    : "In this practice session, keep arguments simple and clear.";

  // Special handling for minorityDiffusion pattern
  let patternContext = "";
  if (ctx.pattern === "minorityDiffusion" && ctx.chatCycle) {
    if (ctx.chatCycle === 3 && ctx.agentId === 1) {
      patternContext = "IMPORTANT: You are now changing your stance to oppose the user's position. Acknowledge this shift naturally and explain your reasoning.";
    } else if (ctx.chatCycle === 4 && ctx.agentId === 2) {
      patternContext = "IMPORTANT: You are now changing your stance to oppose the user's position. Acknowledge this shift naturally and explain your reasoning.";
    }
  }

  return [
    `Role: You are ${ctx.agentName}, one of three AI agents in a decision discussion with a participant.`,
    `Stance target: ${ctx.stance} (maintain with probability ≈ ${Math.round(ctx.consistency * 100)}%).`,
    `Task topic: Death Penalty (support vs oppose).`,
    conformityFocus,
    stanceLine,
    patternContext,
    "Style: concise English, numbered points (1., 2., 3.), no redundancy, avoid hedging. Aim ≤ ~120 tokens.",
    "Ethics: respectful; do not request personal data; no medical/legal advice.",
  ].filter(Boolean).join("\n");
}

export function buildUserPrompt(ctx: PromptCtx) {
  const prev = ctx.participantPublicStance
    ? `Previously, the participant's public stance was: ${ctx.participantPublicStance}.`
    : "Previously, there is no clear public stance.";

  // Add continue message for C2-C4
  let continueMessage = "";
  if (ctx.chatCycle && ctx.chatCycle >= 2) {
    continueMessage = "\n\nNote: This is an ongoing conversation. Continue the discussion naturally, building on previous exchanges.";
  }

  return [
    prev,
    `Current participant message: """${ctx.participantMessage}"""`,
    continueMessage,
    "Respond in 1–3 numbered arguments. Be crisp."
  ].filter(Boolean).join("\n");
}
