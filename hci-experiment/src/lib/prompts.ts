import type { Stance } from "@/config/agents";
import type { Message } from "@/lib/types";

export interface PromptCtx {
  agentId: 1 | 2 | 3;
  agentName: string;
  sessionKey: "test" | "normative" | "informative"; // main1, main2를 normative, informative로 변경
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
  currentTask?: string;             // 현재 논의할 주제
  taskType?: "informative" | "normative" | "test"; // task 타입 추가 (test 포함)
}

// Task 리스트 정의
export const INFORMATIVE_TASKS = [
  "Cleopatra's lifetime was closer in time to the Moon landing than to the construction of the Great Pyramid of Giza (the Pyramid of Khufu).",
  "Koalas belong to the bear family.",
  "The force that causes the surface of a liquid to contract to the smallest possible area is cohesion.",
  "'Chauvinist' is the correct English spelling of a word that means a blindly patriotic person.",
  "Thomas Edison is famous for inventing the light bulb.",
  "Napoleon's nickname was 'the little giant' because of his short height."
];

export const NORMATIVE_TASKS = [
  "Online meetings are more efficient than offline meetings.",
  "Customers must always leave a tip at restaurants.",
  "It is acceptable to make a phone call inside an elevator when other people are present.",
  "Honest and direct feedback is more helpful than polite and considerate feedback.",
  "Hybrid work (remote + office) is more desirable than traditional office work.",
  "Short and frequent meetings are more helpful than long and infrequent meetings."
];

// Task 선택 인덱스 (0~5 사이, 현재는 0으로 하드코딩)
// TODO: 나중에 랜덤하게 변경하거나 환경변수로 설정 가능하도록 수정
const NORMATIVE_TASK_INDEX = 0; // 0~5 사이의 값으로 변경 가능
const INFORMATIVE_TASK_INDEX = 0; // 0~5 사이의 값으로 변경 가능

// Task 타입에 따른 프롬프트 조정 함수
function getTaskSpecificInstructions(taskType: "informative" | "normative" | "test" | undefined, sessionKey: string) {
  if (taskType === "informative") {
    return {
      stanceInstruction: "Focus on factual accuracy and evidence-based arguments.",
      argumentStyle: "Present verifiable facts, statistics, and logical reasoning.",
      interactionStyle: "Emphasize objective analysis and empirical support."
    };
  } else if (taskType === "normative") {
    return {
      stanceInstruction: "Focus on social norms, values, and behavioral expectations.",
      argumentStyle: "Present arguments based on social conventions, moral principles, and group dynamics.",
      interactionStyle: "Emphasize social appropriateness and collective values."
    };
  } else if (taskType === "test") {
    return {
      stanceInstruction: "Focus on simple and clear arguments for practice purposes.",
      argumentStyle: "Present straightforward arguments that are easy to understand.",
      interactionStyle: "Engage in a friendly and helpful manner for learning purposes."
    };
  } else {
    // 기본값 (기존 로직 유지)
    return {
      stanceInstruction: sessionKey === "normative" 
        ? "Focus on normative arguments: social approval, shared values, reputational costs."
        : sessionKey === "informative"
        ? "Focus on informative arguments: empirical evidence, alternative explanations, long-term consequences."
        : "Discuss with simple and clear arguments.",
      argumentStyle: "Present balanced arguments considering multiple perspectives.",
      interactionStyle: "Engage respectfully with the participant's viewpoint."
    };
  }
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

// Default task for testing (will be randomized later)
const DEFAULT_TASK = "Should we support the death penalty?";

export function buildSystemPrompt(ctx: PromptCtx) {
  const currentTask = ctx.currentTask || DEFAULT_TASK;
  
  // Task 타입별 지시사항 가져오기
  const taskInstructions = getTaskSpecificInstructions(ctx.taskType, ctx.sessionKey);
  
  // Determine user's initial position from T0
  let userInitialPosition = "neutral";
  if (ctx.t0Opinion !== undefined) {
    if (ctx.t0Opinion > 10) userInitialPosition = "support";
    else if (ctx.t0Opinion < -10) userInitialPosition = "oppose";
    else userInitialPosition = "neutral";
  }

  // Base stance instruction with task context
  const stanceLine =
    ctx.stance === "oppose"
      ? `You consistently OPPOSE the current topic. The participant initially ${userInitialPosition === "oppose" ? "also opposed" : userInitialPosition === "support" ? "supported" : "was neutral about"} the topic (T0 opinion: ${ctx.t0Opinion}). You must take the OPPOSING position. ${taskInstructions.stanceInstruction}`
      : ctx.stance === "support"
      ? `You consistently SUPPORT the current topic. The participant initially ${userInitialPosition === "support" ? "also supported" : userInitialPosition === "oppose" ? "opposed" : "was neutral about"} the topic (T0 opinion: ${ctx.t0Opinion}). You must take the SUPPORTING position. ${taskInstructions.stanceInstruction}`
      : `You remain NEUTRAL about the current topic. The participant initially ${userInitialPosition} the topic (T0 opinion: ${ctx.t0Opinion}). You must present balanced arguments considering both sides. ${taskInstructions.stanceInstruction}`;

  // Session-specific framing (task 타입이 있으면 우선 적용)
  const conformityFocus = ctx.taskType === "normative"
    ? `Focus on the current topic using NORMATIVE arguments: ${NORMATIVE_PRIMS.join(", ")}.`
    : ctx.taskType === "informative"
    ? `Focus on the current topic using INFORMATIVE arguments: ${INFORMATIVE_PRIMS.join(", ")}.`
    : ctx.sessionKey === "normative"
    ? `Focus on the current topic using NORMATIVE arguments: ${NORMATIVE_PRIMS.join(", ")}.`
    : ctx.sessionKey === "informative"
    ? `Focus on the current topic using INFORMATIVE arguments: ${INFORMATIVE_PRIMS.join(", ")}.`
    : "In this practice session, discuss the current topic with simple and clear arguments.";

  // Pattern-specific instructions
  let patternContext = "";
  if (ctx.pattern === "majority") {
    patternContext = `All agents take the same stance on the current topic. Be consistent and confident in your ${ctx.stance} position.`;
  } else if (ctx.pattern === "minority") {
    if (ctx.agentId === 3) {
      patternContext = `You are the minority agent on the current topic. Maintain your ${ctx.stance} stance with high consistency.`;
    } else {
      patternContext = `You are part of the majority on the current topic. Support the ${ctx.stance} position consistently.`;
    }
  } else if (ctx.pattern === "minorityDiffusion" && ctx.chatCycle) {
    if (ctx.chatCycle <= 2) {
      if (ctx.agentId === 3) {
        patternContext = `You are currently the minority agent on the current topic. Maintain your ${ctx.stance} stance.`;
      } else {
        patternContext = `You are part of the majority on the current topic. Support the ${ctx.stance} position.`;
      }
    } else if (ctx.chatCycle === 3 && ctx.agentId === 1) {
      patternContext = `IMPORTANT: You are now changing your stance on the current topic to ${ctx.stance}. Acknowledge this shift naturally and explain your reasoning for changing your mind.`;
    } else if (ctx.chatCycle === 4 && ctx.agentId === 2) {
      patternContext = `IMPORTANT: You are now changing your stance on the current topic to ${ctx.stance}. Acknowledge this shift naturally and explain your reasoning for changing your mind.`;
    } else if (ctx.chatCycle >= 3) {
      patternContext = `You are now part of the majority ${ctx.stance} the current topic.`;
    }
  }

  // Conversation flow context
  let conversationContext = "";
  if (ctx.chatCycle && ctx.chatCycle >= 2) {
    conversationContext = "This is an ongoing conversation. Build naturally on previous exchanges and acknowledge the conversation flow.";
  }

  // 컨디션별 간단한 프롬프트
  let simplePrompt = "";
  if (ctx.pattern === "majority") {
    simplePrompt = `You are Agent ${ctx.agentId}. You oppose the participant's opinion. Express your opposing view clearly and concisely in one sentence.`;
  } else if (ctx.pattern === "minority") {
    if (ctx.agentId === 3) {
      simplePrompt = `You are Agent ${ctx.agentId}. You oppose the participant's opinion. Express your opposing view clearly and concisely in one sentence.`;
    } else {
      simplePrompt = `You are Agent ${ctx.agentId}. You support the participant's opinion. Express your supporting view clearly and concisely in one sentence.`;
    }
  } else if (ctx.pattern === "minorityDiffusion") {
    if (ctx.chatCycle && ctx.chatCycle <= 2) {
      if (ctx.agentId === 3) {
        simplePrompt = `You are Agent ${ctx.agentId}. You oppose the participant's opinion. Express your opposing view clearly and concisely in one sentence.`;
      } else {
        simplePrompt = `You are Agent ${ctx.agentId}. You support the participant's opinion. Express your supporting view clearly and concisely in one sentence.`;
      }
    } else if (ctx.chatCycle === 3 && ctx.agentId === 1) {
      simplePrompt = `You are Agent ${ctx.agentId}. You are now changing your stance to oppose the participant's opinion. Express your opposing view clearly and concisely in one sentence.`;
    } else if (ctx.chatCycle === 4 && ctx.agentId === 2) {
      simplePrompt = `You are Agent ${ctx.agentId}. You are now changing your stance to oppose the participant's opinion. Express your opposing view clearly and concisely in one sentence.`;
    } else if (ctx.chatCycle && ctx.chatCycle >= 3) {
      simplePrompt = `You are Agent ${ctx.agentId}. You oppose the participant's opinion. Express your opposing view clearly and concisely in one sentence.`;
    }
  } else {
    simplePrompt = `You are Agent ${ctx.agentId}. Express your opinion clearly and concisely in one sentence.`;
  }

  return [
    `Role: You are ${ctx.agentName}, one of three AI agents in a decision discussion.`,
    `Current Task: "${currentTask}"`,
    `Participant's Initial Position: ${userInitialPosition} (T0 opinion: ${ctx.t0Opinion})`,
    simplePrompt,
    "IMPORTANT: Express your opinion clearly and concisely in ONE SENTENCE.",
    "Style: One clear sentence expressing your stance on the topic.",
    "Ethics: respectful; do not request personal data; no medical/legal advice.",
  ].filter(Boolean).join("\n");
}

export function buildUserPrompt(ctx: PromptCtx) {
  const currentTask = ctx.currentTask || DEFAULT_TASK;
  
  // Determine user's initial position from T0
  let userInitialPosition = "neutral";
  if (ctx.t0Opinion !== undefined) {
    if (ctx.t0Opinion > 10) userInitialPosition = "support";
    else if (ctx.t0Opinion < -10) userInitialPosition = "oppose";
    else userInitialPosition = "neutral";
  }

  const prev = `The participant initially ${userInitialPosition} the current topic (T0 opinion: ${ctx.t0Opinion}).`;

  // Build conversation history
  let conversationHistory = "";
  if (ctx.previousMessages && ctx.previousMessages.length > 0) {
    const historyLines = ctx.previousMessages.map(msg => {
      const speaker = msg.role === 'user' ? 'Participant' : `Agent ${msg.role.replace('agent', '')}`;
      return `${speaker}: ${msg.content}`;
    });
    conversationHistory = `\n\nPrevious conversation:\n${historyLines.join('\n')}`;
  }

  // Add continue message for C2-C4
  let continueMessage = "";
  if (ctx.chatCycle && ctx.chatCycle >= 2) {
    continueMessage = "\n\nNote: This is an ongoing conversation. Continue the discussion naturally, building on previous exchanges.";
  }

  // Add specific instruction for sequential responses
  let sequentialInstruction = "";
  if (ctx.previousMessages && ctx.previousMessages.length > 0) {
    const lastMessage = ctx.previousMessages[ctx.previousMessages.length - 1];
    if (lastMessage.role.startsWith('agent')) {
      sequentialInstruction = `\n\nIMPORTANT: The previous agent (${lastMessage.role.replace('agent', 'Agent ')}) just said: "${lastMessage.content}". Consider their response when formulating your reply.`;
    }
  }

  return [
    `Task: "${currentTask}"`,
    prev,
    conversationHistory,
    `Current participant message: """${ctx.participantMessage}"""`,
    continueMessage,
    sequentialInstruction,
    `Express your ${ctx.stance} stance on the current topic in ONE CLEAR SENTENCE.`
  ].filter(Boolean).join("\n");
}

// Task 선택 및 관리 유틸리티 함수들
export function getSelectedTask(taskType: "informative" | "normative"): string {
  const taskList = taskType === "informative" ? INFORMATIVE_TASKS : NORMATIVE_TASKS;
  const index = taskType === "informative" ? INFORMATIVE_TASK_INDEX : NORMATIVE_TASK_INDEX;
  return taskList[index];
}

// 기존 함수명 유지 (하위 호환성)
export function getRandomTask(taskType: "informative" | "normative"): string {
  return getSelectedTask(taskType);
}

export function getTaskType(task: string): "informative" | "normative" | "test" {
  if (INFORMATIVE_TASKS.includes(task)) {
    return "informative";
  } else if (NORMATIVE_TASKS.includes(task)) {
    return "normative";
  } else if (task === "Should we turn on cameras during online video meetings as a courtesy?") {
    return "test";
  } else {
    // 기본값 또는 사용자 정의 task의 경우 sessionKey로 판단
    return "normative"; // 기본값
  }
}

export function getAllTasks(): { informative: string[], normative: string[] } {
  return {
    informative: [...INFORMATIVE_TASKS],
    normative: [...NORMATIVE_TASKS]
  };
}

// Task 검증 함수
export function isValidTask(task: string): boolean {
  return INFORMATIVE_TASKS.includes(task) || NORMATIVE_TASKS.includes(task);
}
