import type { Stance } from "@/config/agents";

export interface Agent {
  id: 1 | 2 | 3;
  name: string;
  expertise: string;
  perspective: string;
}

export const AGENTS: Agent[] = [
  {
    id: 1,
    name: "Agent 1 (Red)",
    expertise: "Criminal Justice & Law Enforcement",
    perspective: "Focuses on crime prevention, law enforcement effectiveness, and public safety considerations."
  },
  {
    id: 2,
    name: "Agent 2 (Green)", 
    expertise: "Human Rights & Ethics",
    perspective: "Emphasizes human dignity, civil liberties, and moral implications of state-sanctioned violence."
  },
  {
    id: 3,
    name: "Agent 3 (Blue)",
    expertise: "Economics & Public Policy",
    perspective: "Analyzes costs, benefits, and policy implications from a utilitarian perspective."
  },
];

export function getAgentColor(agentId: number): string {
  switch (agentId) {
    case 1: return "#ef4444"; // Red
    case 2: return "#22c55e"; // Green  
    case 3: return "#3b82f6"; // Blue
    default: return "#6b7280"; // Gray
  }
}

export type { Stance };
