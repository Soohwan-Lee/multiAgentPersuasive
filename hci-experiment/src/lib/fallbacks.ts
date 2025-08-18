import type { Stance } from "@/config/agents";

export const FALLBACK: Record<Stance, string> = {
  support: "I agree with your opinion. 1) This approach has practical benefits. 2) It provides effective solutions. 3) The implementation is feasible.",
  oppose: "I understand your opinion, but I have a different perspective. 1) There are significant risks to consider. 2) Alternative approaches may be better. 3) The evidence suggests caution.",
  neutral: "I see both sides of this issue. 1) There are valid arguments on both sides. 2) We need to consider the trade-offs carefully. 3) More information would help clarify the best approach.",
};
