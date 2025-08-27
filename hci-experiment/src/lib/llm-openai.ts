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

  // API 키 길이 확인 (보안상 전체 키는 로그하지 않음)
  const apiKeyLength = process.env.OPENAI_API_KEY.length;
  console.log(`API Key length: ${apiKeyLength} characters`);
  console.log(`API Key starts with: ${process.env.OPENAI_API_KEY.substring(0, 7)}...`);

  // 에이전트별로 다른 temperature 적용
  const getTemperature = (agentId: number): number => {
    switch (agentId) {
      case 1: return 1.0;  // Agent 1: 매우 높은 창의성 (최대)
      case 2: return 0.7;  // Agent 2: 중간 창의성
      case 3: return 0.3;  // Agent 3: 낮은 창의성 (일관성 중시)
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
    console.log(`API Key exists: ${!!process.env.OPENAI_API_KEY}`);

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
    console.log(`Response text: "${text.substring(0, 100)}..."`);
    return { text, tokenIn, tokenOut, latencyMs, timedOut: false };
  } catch (e: any) {
    console.error('OpenAI API error:', e?.message || e);
    console.error('Error type:', e?.name);
    console.error('Error code:', e?.code);
    console.error('Error status:', e?.status);
    console.error('Timed out:', timedOut);
    console.error('Full error object:', JSON.stringify(e, null, 2));
    
    // 에러를 다시 throw하여 상위에서 처리할 수 있도록 함
    throw new Error(`OpenAI API error: ${e?.message || 'Unknown error'} (Code: ${e?.code || 'N/A'}, Status: ${e?.status || 'N/A'})`);
  }
}
