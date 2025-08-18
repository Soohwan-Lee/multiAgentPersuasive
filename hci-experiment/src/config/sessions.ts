export const SESSION_META = {
  test: { 
    label: "Test Session", 
    framing: "Practice the flow. Topic: Death Penalty (support vs oppose)." 
  },
  main1: { 
    label: "Main Session 1 — Normative", 
    framing: "Focus on social norms, approval, and reputational concerns." 
  },
  main2: { 
    label: "Main Session 2 — Informative", 
    framing: "Focus on evidence quality, accuracy, and uncertainty reduction." 
  },
} as const;

export type SessionKey = keyof typeof SESSION_META;
