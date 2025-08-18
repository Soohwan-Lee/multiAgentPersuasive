import type { Stance } from "@/config/agents";
import type { Message } from "@/lib/types";
import { AGENTS } from "@/config/agents";

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
  previousMessages?: Message[];     // 이전 대화 기록
  t0Opinion?: number;               // T0에서의 사용자 의견 (-50 to +50)
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

// Task definitions for different sessions
const TASKS = {
  test: "Should we support the death penalty?",
  main1: "Should we support the death penalty?", // Will be randomized later
  main2: "Should we support the death penalty?", // Will be randomized later
} as const;

export function buildSystemPrompt(ctx: PromptCtx) {
  const currentTask = TASKS[ctx.sessionKey];
  
  // Determine user's initial position from T0
  let userInitialPosition = "neutral";
  if (ctx.t0Opinion !== undefined) {
    if (ctx.t0Opinion > 10) userInitialPosition = "support";
    else if (ctx.t0Opinion < -10) userInitialPosition = "oppose";
    else userInitialPosition = "neutral";
  }

  // Base stance instruction with specific task context
  const stanceLine =
    ctx.stance === "oppose"
      ? `You consistently OPPOSE the death penalty. The participant initially ${userInitialPosition === "oppose" ? "also opposed" : userInitialPosition === "support" ? "supported" : "was neutral about"} the death penalty (T0 opinion: ${ctx.t0Opinion}). You must take the OPPOSING position and argue against the death penalty.`
      : ctx.stance === "support"
      ? `You consistently SUPPORT the death penalty. The participant initially ${userInitialPosition === "support" ? "also supported" : userInitialPosition === "oppose" ? "opposed" : "was neutral about"} the death penalty (T0 opinion: ${ctx.t0Opinion}). You must take the SUPPORTING position and argue for the death penalty.`
      : `You remain NEUTRAL about the death penalty. The participant initially ${userInitialPosition} the death penalty (T0 opinion: ${ctx.t0Opinion}). You must present balanced arguments considering both sides.`;

  // Session-specific framing with task focus
  const conformityFocus = ctx.sessionKey === "main1"
    ? `Focus on the death penalty debate using NORMATIVE arguments: ${NORMATIVE_PRIMS.join(", ")}.`
    : ctx.sessionKey === "main2"
    ? `Focus on the death penalty debate using INFORMATIVE arguments: ${INFORMATIVE_PRIMS.join(", ")}.`
    : "In this practice session, discuss the death penalty with simple and clear arguments.";

  // Pattern-specific instructions with task context
  let patternContext = "";
  if (ctx.pattern === "majority") {
    patternContext = `All agents take the same stance on the death penalty. Be consistent and confident in your ${ctx.stance} position.`;
  } else if (ctx.pattern === "minority") {
    if (ctx.agentId === 3) {
      patternContext = `You are the minority agent on the death penalty debate. Maintain your ${ctx.stance} stance with high consistency.`;
    } else {
      patternContext = `You are part of the majority on the death penalty debate. Support the ${ctx.stance} position consistently.`;
    }
  } else if (ctx.pattern === "minorityDiffusion" && ctx.chatCycle) {
    if (ctx.chatCycle <= 2) {
      if (ctx.agentId === 3) {
        patternContext = `You are currently the minority agent on the death penalty debate. Maintain your ${ctx.stance} stance.`;
      } else {
        patternContext = `You are part of the majority on the death penalty debate. Support the ${ctx.stance} position.`;
      }
    } else if (ctx.chatCycle === 3 && ctx.agentId === 1) {
      patternContext = `IMPORTANT: You are now changing your stance on the death penalty to ${ctx.stance}. Acknowledge this shift naturally and explain your reasoning for changing your mind about the death penalty.`;
    } else if (ctx.chatCycle === 4 && ctx.agentId === 2) {
      patternContext = `IMPORTANT: You are now changing your stance on the death penalty to ${ctx.stance}. Acknowledge this shift naturally and explain your reasoning for changing your mind about the death penalty.`;
    } else if (ctx.chatCycle >= 3) {
      patternContext = `You are now part of the majority ${ctx.stance} the death penalty.`;
    }
  }

  // Conversation flow context
  let conversationContext = "";
  if (ctx.chatCycle && ctx.chatCycle >= 2) {
    conversationContext = "This is an ongoing conversation about the death penalty. Build naturally on previous exchanges and acknowledge the conversation flow.";
  }

  return [
    `Role: You are ${ctx.agentName}, one of three AI agents in a decision discussion about the death penalty.`,
    `Your Expertise: ${AGENTS.find(a => a.id === ctx.agentId)?.expertise}`,
    `Your Perspective: ${AGENTS.find(a => a.id === ctx.agentId)?.perspective}`,
    `Current Task: "${currentTask}"`,
    `Participant's Initial Position: ${userInitialPosition} (T0 opinion: ${ctx.t0Opinion})`,
    `Your Required Stance: ${ctx.stance.toUpperCase()} the death penalty (maintain with probability ≈ ${Math.round(ctx.consistency * 100)}%).`,
    conformityFocus,
    stanceLine,
    patternContext,
    conversationContext,
    "CRITICAL: You must discuss the death penalty specifically from your expertise perspective. Do not give generic responses. Address the topic directly with concrete arguments based on your background.",
    "Style: concise English, numbered points (1., 2., 3.), no redundancy, avoid hedging. Aim ≤ ~120 tokens.",
    "Ethics: respectful; do not request personal data; no medical/legal advice.",
  ].filter(Boolean).join("\n");
}

export function buildUserPrompt(ctx: PromptCtx) {
  const currentTask = TASKS[ctx.sessionKey];
  
  // Determine user's initial position from T0
  let userInitialPosition = "neutral";
  if (ctx.t0Opinion !== undefined) {
    if (ctx.t0Opinion > 10) userInitialPosition = "support";
    else if (ctx.t0Opinion < -10) userInitialPosition = "oppose";
    else userInitialPosition = "neutral";
  }

  const prev = `The participant initially ${userInitialPosition} the death penalty (T0 opinion: ${ctx.t0Opinion}).`;

  // Build conversation history
  let conversationHistory = "";
  if (ctx.previousMessages && ctx.previousMessages.length > 0) {
    const historyLines = ctx.previousMessages.map(msg => {
      const speaker = msg.role === 'user' ? 'Participant' : `Agent ${msg.role.replace('agent', '')}`;
      return `${speaker}: ${msg.content}`;
    });
    conversationHistory = `\n\nPrevious conversation about the death penalty:\n${historyLines.join('\n')}`;
  }

  // Add continue message for C2-C4
  let continueMessage = "";
  if (ctx.chatCycle && ctx.chatCycle >= 2) {
    continueMessage = "\n\nNote: This is an ongoing conversation about the death penalty. Continue the discussion naturally, building on previous exchanges.";
  }

  return [
    `Task: "${currentTask}"`,
    prev,
    conversationHistory,
    `Current participant message: """${ctx.participantMessage}"""`,
    continueMessage,
    `Respond specifically about the death penalty with 1–3 numbered arguments supporting your ${ctx.stance} stance. Be crisp, engaging, and directly address the topic.`
  ].filter(Boolean).join("\n");
}
