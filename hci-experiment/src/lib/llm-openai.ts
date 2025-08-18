import OpenAI from "openai";

const client = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || '' 
});

export async function callOpenAIChat({
  system, user, model = process.env.LLM_MODEL || "gpt-4o", timeoutMs = 12000, maxTokens = 180,
}: { system: string; user: string; model?: string; timeoutMs?: number; maxTokens?: number; }) {
  // Check if API key is available
  if (!process.env.OPENAI_API_KEY) {
    return { 
      text: "API key not configured", 
      tokenIn: undefined, 
      tokenOut: undefined, 
      latencyMs: 0, 
      timedOut: true 
    };
  }

  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);
  const started = Date.now();
  try {
    const res = await client.chat.completions.create({
      model,
      temperature: 0.7, // Slightly higher for more dynamic responses
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
      max_tokens: maxTokens,
    }, { signal: ac.signal });
    const text = res.choices?.[0]?.message?.content?.trim() || "";
    const latencyMs = Date.now() - started;
    const tokenOut = res.usage?.completion_tokens ?? undefined;
    const tokenIn = res.usage?.prompt_tokens ?? undefined;
    return { text, tokenIn, tokenOut, latencyMs, timedOut: false };
  } catch (e: any) {
    const latencyMs = Date.now() - started;
    const timedOut = e?.name === "AbortError";
    return { text: "", tokenIn: undefined, tokenOut: undefined, latencyMs, timedOut };
  } finally {
    clearTimeout(t);
  }
}
