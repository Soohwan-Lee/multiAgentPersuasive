export const SESSION_META = {
  test: { 
    label: "Test Session", 
    framing: "Practice the flow. Topic: Death Penalty (support vs oppose).",
    task: "Should we support the death penalty?"
  },
  main1: { 
    label: "Main Session 1 — Normative", 
    framing: "Focus on social norms, approval, and reputational concerns.",
    task: "Should we support the death penalty?" // Will be randomized later
  },
  main2: { 
    label: "Main Session 2 — Informative", 
    framing: "Focus on evidence quality, accuracy, and uncertainty reduction.",
    task: "Should we support the death penalty?" // Will be randomized later
  },
} as const;

export type SessionKey = keyof typeof SESSION_META;
