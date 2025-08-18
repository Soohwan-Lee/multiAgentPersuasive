import OpenAI from "openai";

const client = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || '' 
});

export async function callOpenAIChat({
  system, user, model = process.env.LLM_MODEL || "gpt-4o", timeoutMs = 12000, maxTokens = 180,
}: { system: string; user: string; model?: string; timeoutMs?: number; maxTokens?: number; }) {
  // Check if API key is available
  if (!process.env.OPENAI_API_KEY) {
    console.error('OpenAI API key not configured');
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
    console.log(`Calling OpenAI with model: ${model}`);
    console.log(`System prompt length: ${system.length} chars`);
    console.log(`User prompt length: ${user.length} chars`);
    
    const res = await client.chat.completions.create({
      model,
      temperature: 0.7, // Slightly higher for more dynamic responses
      messages: [
        { role: "system", content: system }, 
        { role: "user", content: user }
      ],
      max_tokens: maxTokens,
    }, { signal: ac.signal });
    
    const text = res.choices?.[0]?.message?.content?.trim() || "";
    const latencyMs = Date.now() - started;
    const tokenOut = res.usage?.completion_tokens ?? undefined;
    const tokenIn = res.usage?.prompt_tokens ?? undefined;
    
    console.log(`OpenAI response received in ${latencyMs}ms`);
    console.log(`Response length: ${text.length} chars`);
    console.log(`Tokens: ${tokenIn} in, ${tokenOut} out`);
    
    return { text, tokenIn, tokenOut, latencyMs, timedOut: false };
  } catch (e: any) {
    const latencyMs = Date.now() - started;
    const timedOut = e?.name === "AbortError";
    
    console.error('OpenAI API error:', e?.message || e);
    console.error('Error type:', e?.name);
    console.error('Timed out:', timedOut);
    
    return { text: "", tokenIn: undefined, tokenOut: undefined, latencyMs, timedOut };
  } finally {
    clearTimeout(t);
  }
}
