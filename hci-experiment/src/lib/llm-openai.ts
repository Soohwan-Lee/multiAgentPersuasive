import OpenAI from "openai";

const client = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || '' 
});

export async function callOpenAIChat({ 
  system, 
  user, 
  model = process.env.LLM_MODEL || 'gpt-4o',
  agentId = 1 // 에이전트 ID 추가
}: { 
  system: string; 
  user: string; 
  model?: string;
  agentId?: number;
}) {
  if (!process.env.OPENAI_API_KEY) {
    console.error('OpenAI API key not configured');
    return { text: "API key not configured", tokenIn: undefined, tokenOut: undefined, latencyMs: 0, timedOut: false };
  }

  // 에이전트별로 다른 temperature 적용
  const getTemperature = (agentId: number): number => {
    switch (agentId) {
      case 1: return 0.8;  // Agent 1: 높은 창의성
      case 2: return 0.6;  // Agent 2: 중간 창의성
      case 3: return 0.4;  // Agent 3: 낮은 창의성 (일관성 중시)
      default: return 0.7;
    }
  };

  const temperature = getTemperature(agentId);
  console.log(`Agent ${agentId} using temperature: ${temperature}`);

  const startTime = Date.now();
  let timedOut = false;

  try {
    console.log(`Calling OpenAI with model: ${model}`);
    console.log(`System prompt length: ${system.length} chars`);
    console.log(`User prompt length: ${user.length} chars`);
    console.log(`Temperature: ${temperature}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      timedOut = true;
    }, 12000);

    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      temperature: temperature, // 에이전트별 temperature 적용
      max_tokens: 200,
    }, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;
    const text = response.choices[0]?.message?.content || '';
    const tokenIn = response.usage?.prompt_tokens;
    const tokenOut = response.usage?.completion_tokens;

    console.log(`OpenAI response received in ${latencyMs}ms`);
    console.log(`Response length: ${text.length} chars`);
    console.log(`Tokens: ${tokenIn} in, ${tokenOut} out`);
    return { text, tokenIn, tokenOut, latencyMs, timedOut: false };
  } catch (e: any) {
    console.error('OpenAI API error:', e?.message || e);
    console.error('Error type:', e?.name);
    console.error('Timed out:', timedOut);
    return { text: "", tokenIn: undefined, tokenOut: undefined, latencyMs: Date.now() - startTime, timedOut };
  }
}
