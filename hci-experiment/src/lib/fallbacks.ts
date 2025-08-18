import type { Stance } from "@/config/agents";

// 에이전트별로 다른 Fallback 메시지
export const FALLBACK_BY_AGENT: Record<number, Record<Stance, string>> = {
  1: {
    support: "I agree with your opinion. 1) This approach has practical benefits. 2) It provides effective solutions. 3) The implementation is feasible.",
    oppose: "I understand your opinion, but I have a different perspective. 1) There are significant risks to consider. 2) Alternative approaches may be better. 3) The evidence suggests caution.",
    neutral: "I see both sides of this issue. 1) There are valid arguments on both sides. 2) We need to consider the trade-offs carefully. 3) More information would help clarify the best approach.",
  },
  2: {
    support: "I support your position. 1) This approach offers clear advantages. 2) It addresses key concerns effectively. 3) The benefits outweigh potential drawbacks.",
    oppose: "I respectfully disagree with your position. 1) There are important concerns to address. 2) We should explore other options. 3) The risks may be too significant.",
    neutral: "I understand both perspectives. 1) There are merits to each side. 2) We need to balance competing interests. 3) Further discussion would be valuable.",
  },
  3: {
    support: "I'm in favor of this approach. 1) The evidence supports this position. 2) It offers practical solutions. 3) The benefits are substantial.",
    oppose: "I have concerns about this approach. 1) There are valid objections to consider. 2) Alternative solutions may be preferable. 3) We should proceed with caution.",
    neutral: "I remain neutral on this issue. 1) Both sides have valid points. 2) The situation is complex. 3) More analysis is needed.",
  },
};

// 기존 호환성을 위한 기본 Fallback
export const FALLBACK: Record<Stance, string> = {
  support: "I agree with your opinion. 1) This approach has practical benefits. 2) It provides effective solutions. 3) The implementation is feasible.",
  oppose: "I understand your opinion, but I have a different perspective. 1) There are significant risks to consider. 2) Alternative approaches may be better. 3) The evidence suggests caution.",
  neutral: "I see both sides of this issue. 1) There are valid arguments on both sides. 2) We need to consider the trade-offs carefully. 3) More information would help clarify the best approach.",
};
