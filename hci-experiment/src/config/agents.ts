export type Stance = "support" | "oppose" | "neutral";

export interface Agent {
  id: 1 | 2 | 3;
  name: string;
}

export const AGENTS: Agent[] = [
  {
    id: 1,
    name: "Agent 1 (Red)",
  },
  {
    id: 2,
    name: "Agent 2 (Green)", 
  },
  {
    id: 3,
    name: "Agent 3 (Blue)",
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
