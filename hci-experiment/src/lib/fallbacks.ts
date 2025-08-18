import type { Stance } from "@/config/agents";

export const FALLBACK: Record<Stance, string> = {
  support: "I support the death penalty. 1) Deterrent effect on violent crime. 2) Justice for victims and families. 3) Cost-effective compared to life imprisonment.",
  oppose: "I oppose the death penalty. 1) Risk of executing innocent people. 2) No clear deterrent effect. 3) More expensive than life imprisonment.",
  neutral: "The death penalty is complex. 1) Need for strong evidence standards. 2) Consider alternatives like life without parole. 3) Balance justice with human rights.",
};
