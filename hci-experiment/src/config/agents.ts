export const AGENTS = [
  { id: 1, name: "Agent 1", color: { r: 255, g: 0, b: 0 } },     // Red
  { id: 2, name: "Agent 2", color: { r: 0, g: 128, b: 0 } },     // Green
  { id: 3, name: "Agent 3", color: { r: 0, g: 102, b: 204 } },   // Blue
];

export type Stance = "support" | "oppose" | "neutral";

export function getAgentColor(agentId: number): string {
  const agent = AGENTS.find(a => a.id === agentId);
  if (!agent) return "#666666";
  return `rgb(${agent.color.r}, ${agent.color.g}, ${agent.color.b})`;
}
