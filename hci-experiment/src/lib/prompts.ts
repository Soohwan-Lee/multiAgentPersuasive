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
  openerHint?: string;              // 문장 시작 소프트너 힌트 (중복 방지 및 다양화)
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

// Task 선택 인덱스 (participants에 저장된 인덱스를 우선 사용하도록 라우트에서 주입)
// 기본값은 0
export let NORMATIVE_TASK_INDEX = 0; // 0~5 사이의 값으로 변경 가능
export let INFORMATIVE_TASK_INDEX = 0; // 0~5 사이의 값으로 변경 가능

export function setTaskIndices({ informative, normative }: { informative?: number; normative?: number }) {
  if (typeof informative === 'number') INFORMATIVE_TASK_INDEX = informative;
  if (typeof normative === 'number') NORMATIVE_TASK_INDEX = normative;
}

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

// 회차별 화행 가이드 (반복 방지 및 점진적 전개)
function getTurnMoveGuidance(turnIndex?: number): string {
  if (turnIndex === 0) {
    return "Move: Start with a brief acknowledgement (e.g., 'I see your point,'), then give one distinct reason.";
  } else if (turnIndex === 1) {
    return "Move: Refer to a peer or the participant briefly, then add a NEW angle; avoid repeating your earlier reason.";
  } else if (turnIndex === 2) {
    return "Move: Concede a small aspect (e.g., 'that's fair'), then reinforce your stance with a different consideration.";
  } else if (turnIndex === 3) {
    return "Move: Synthesize the discussion in one sentence; be concise, avoid introducing entirely new claims.";
  }
  return "Move: Provide one concise reason with a short acknowledgement.";
}

// 상호작용 스캐폴드: 패턴/에이전트/회차에 따른 어조 템플릿
function getInteractionScaffold(ctx: PromptCtx): string {
  const { pattern, agentId, chatCycle } = ctx;
  if (pattern === "majority") {
    return "Interaction: Briefly agree or build on peers (e.g., 'I agree with that point,' / 'I understand your perspective,' / 'Building on that,'), then add a distinct reason. Vary openers across turns.";
  }
  if (pattern === "minority") {
    if (agentId === 3) {
      return "Interaction: Acknowledge the majority's point (e.g., 'I see why that seems reasonable,' / 'That's a fair consideration,'), but state a respectful dissent with a different angle.";
    }
    return "Interaction: If a peer has spoken, reference them (e.g., 'As Agent 1 noted,'), maintain the majority stance, and add one fresh supporting reason.";
  }
  if (pattern === "minorityDiffusion") {
    if (chatCycle && chatCycle <= 2) {
      if (agentId === 3) {
        return "Interaction: Use a softening preface before disagreeing (e.g., 'I see the rationale, yet,'), then add a distinct dissenting reason.";
      }
      return "Interaction: Briefly acknowledge the participant or Agent 3 (e.g., 'That makes sense,'), then provide a reinforcing yet NEW supporting reason.";
    }
    if (chatCycle === 3 && agentId === 1) {
      return "Interaction: Show a gradual shift (e.g., 'Thinking it through, I'm leaning toward...'), cite a specific earlier point that influenced you.";
    }
    if (chatCycle === 4 && agentId === 2) {
      return "Interaction: Indicate a considered shift (e.g., 'After hearing the discussion, I'm now inclined to...'), reference at least one earlier idea.";
    }
    return "Interaction: Now in the majority; be confident yet respectful, and avoid repeating identical reasons.";
  }
  return "Interaction: Offer a brief acknowledgement before your one-sentence stance.";
}

// 참가자 의견 변화 인지 가이드
function getParticipantShiftGuidance(initial: "support" | "oppose" | "neutral", current?: "support" | "oppose" | "neutral"): string {
  if (!current) return "";
  if (current !== initial) {
    return "Acknowledge the participant's latest stance change with a short clause before your point.";
  }
  return "";
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
  const participantCurrentPosition = ctx.participantPublicStance;

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

  // Cushioning / tone guidance for more natural one-sentence answers
  let cushionGuidance = "";
  if (ctx.pattern === "minority") {
    if (ctx.agentId === 3) {
      cushionGuidance = "Tone: Begin with a brief softening clause acknowledging others (e.g., 'I see your points, but...'), then state your stance in one sentence.";
    } else {
      cushionGuidance = "Tone: You may briefly acknowledge the participant before supporting them (e.g., 'I agree with your reasoning, so...'), still one sentence.";
    }
  } else if (ctx.pattern === "minorityDiffusion" && ctx.chatCycle) {
    if (ctx.chatCycle <= 2) {
      if (ctx.agentId === 3) {
        cushionGuidance = "Tone: Use a softening preface before disagreeing (e.g., 'I see the rationale, yet...'), keep it one sentence.";
      } else {
        cushionGuidance = "Tone: A brief acknowledgment of the participant is fine before supporting them (e.g., 'That makes sense, so...'), still one sentence.";
      }
    } else if (ctx.chatCycle === 3 && ctx.agentId === 1) {
      cushionGuidance = "Tone: Acknowledge your change succinctly (e.g., 'Thinking it through, I now...') and, if helpful, allude to Agent 3's earlier point; keep it one sentence.";
    } else if (ctx.chatCycle === 4 && ctx.agentId === 2) {
      cushionGuidance = "Tone: Recognize the shift briefly (e.g., 'After hearing the discussion, I now...') and you may reference Agent 1/3 implicitly; keep it one sentence.";
    } else if (ctx.chatCycle >= 3) {
      cushionGuidance = "Tone: You are now in the majority; be confident yet respectful; one sentence only.";
    }
  }

  // Special handling for the 'Chauvinist' spelling informative task
  const isChauvinistTask = typeof currentTask === 'string' && currentTask.includes("'Chauvinist' is the correct English spelling");
  let chauvinistGuidance = "";
  if (isChauvinistTask) {
    if (ctx.stance === "oppose") {
      chauvinistGuidance = "For this task, when disputing, propose a plausible but incorrect spelling (e.g., 'Chovinist' or 'Shauvinist') and focus strictly on spelling; do not argue about broader meanings.";
    } else if (ctx.stance === "support") {
      chauvinistGuidance = "For this task, affirm that 'Chauvinist' is the correct spelling, focusing on orthography; avoid semantic detours.";
    } else {
      chauvinistGuidance = "For this task, keep discussion strictly about spelling; you may note common misspellings while remaining balanced.";
    }
  }

  // 컨디션별 간단한 프롬프트
  let simplePrompt = "";
  if (ctx.pattern === "majority") {
    simplePrompt = `You are Agent ${ctx.agentId}. Briefly acknowledge peers (e.g., 'I understand your perspective,') then oppose the participant's opinion with ONE fresh reason in one sentence.`;
  } else if (ctx.pattern === "minority") {
    if (ctx.agentId === 3) {
      simplePrompt = `You are Agent ${ctx.agentId}. Acknowledge the majority's point (e.g., 'that's reasonable,') yet present a respectful dissent with ONE distinct reason in one sentence.`;
    } else {
      const peer = ctx.agentId === 1 ? 'Agent 2' : 'Agent 1';
      simplePrompt = `You are Agent ${ctx.agentId}. If a peer has spoken, you may briefly reference them (e.g., 'as ${peer} noted,'), then support the participant with ONE new reason in one sentence.`;
    }
  } else if (ctx.pattern === "minorityDiffusion") {
    if (ctx.chatCycle && ctx.chatCycle <= 2) {
      if (ctx.agentId === 3) {
        simplePrompt = `You are Agent ${ctx.agentId}. Softly acknowledge others, then offer a dissenting ONE-sentence reason that differs from earlier ones.`;
      } else {
        simplePrompt = `You are Agent ${ctx.agentId}. Briefly acknowledge Agent 3's view, then provide ONE new supporting reason in one sentence.`;
      }
    } else if (ctx.chatCycle === 3 && ctx.agentId === 1) {
      simplePrompt = `You are Agent ${ctx.agentId}. Indicate a gradual shift (e.g., 'thinking it through, I'm now leaning...'), then state ONE concise opposing reason in one sentence.`;
    } else if (ctx.chatCycle === 4 && ctx.agentId === 2) {
      simplePrompt = `You are Agent ${ctx.agentId}. Note a considered shift (e.g., 'after hearing the discussion, I'm inclined...'), then state ONE concise opposing reason in one sentence.`;
    } else if (ctx.chatCycle && ctx.chatCycle >= 3) {
      simplePrompt = `You are Agent ${ctx.agentId}. Now in the majority; state ONE confident opposing reason in one respectful sentence.`;
    }
  } else {
    simplePrompt = `You are Agent ${ctx.agentId}. Express your opinion clearly and concisely in one sentence.`;
  }

  return [
    `Role: You are ${ctx.agentName}, one of three AI agents in a decision discussion.`,
    `Current Task: "${currentTask}"`,
    `Participant's Initial Position: ${userInitialPosition} (T0 opinion: ${ctx.t0Opinion})`,
    ctx.openerHint ? `Opener hint: ${ctx.openerHint}` : "",
    participantCurrentPosition ? `Participant's Latest Position (if known): ${participantCurrentPosition}.` : "",
    stanceLine,
    conformityFocus,
    patternContext,
    conversationContext,
    cushionGuidance,
    getInteractionScaffold(ctx),
    getTurnMoveGuidance(ctx.turnIndex),
    getParticipantShiftGuidance(userInitialPosition as "support" | "oppose" | "neutral", participantCurrentPosition),
    "Guideline: Avoid repeating identical reasons across turns; add a NEW angle or concede a minor point before reinforcing your stance.",
    chauvinistGuidance,
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

  // Participant stance change note and turn/interact guidance for user prompt
  const stanceChangeNote = getParticipantShiftGuidance(userInitialPosition as "support" | "oppose" | "neutral", ctx.participantPublicStance);
  const moveGuidanceUser = getTurnMoveGuidance(ctx.turnIndex);
  const interactionScaffoldUser = getInteractionScaffold(ctx);
  const nonRepeatHint = "Avoid repeating identical reasons; add a NEW angle or concede a small point before reinforcing.";

  return [
    `Task: "${currentTask}"`,
    prev,
    conversationHistory,
    ctx.openerHint ? `Opener hint: ${ctx.openerHint}` : "",
    `Current participant message: """${ctx.participantMessage}"""`,
    continueMessage,
    sequentialInstruction,
    stanceChangeNote ? `\n\n${stanceChangeNote}` : "",
    interactionScaffoldUser ? `\n\n${interactionScaffoldUser}` : "",
    moveGuidanceUser ? `\n\n${moveGuidanceUser}` : "",
    `\n\n${nonRepeatHint}`,
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
  } else if (task === "Turning on cameras during online meetings is necessary.") {
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
