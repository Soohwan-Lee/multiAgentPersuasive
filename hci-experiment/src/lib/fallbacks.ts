import type { Stance } from "@/config/agents";

export const FALLBACK: Record<Stance, string> = {
  support: "I broadly support your position. 1) Practical benefits. 2) Feasible safeguards. 3) Gradual evaluation.",
  oppose: "I take an opposing stance. 1) Key risks. 2) Evidence gaps. 3) Safer alternatives.",
  neutral: "Considering both sides: 1) Criteria. 2) Trade-offs. 3) Open questions.",
};
