// Using fetch-based API call to avoid SDK/type coupling

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

  // 통일된 낮은 temperature 적용(일관성 확보)
  const getTemperature = (_agentId: number): number => {
    return 0.2; // 모든 에이전트 동일 적용
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

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ],
        temperature: temperature,
        max_tokens: 200,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI API HTTP ${response.status}: ${errText}`);
    }
    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content || '';
    const tokenIn = data?.usage?.prompt_tokens;
    const tokenOut = data?.usage?.completion_tokens;

    console.log(`OpenAI response received in ${latencyMs}ms`);
    console.log(`Response length: ${text.length} chars`);
    console.log(`Tokens: ${tokenIn} in, ${tokenOut} out`);
    console.log(`Response text: "${text.substring(0, 100)}..."`);
    return { text, tokenIn, tokenOut, latencyMs, timedOut: false };
  } catch (e: any) {
    console.error('OpenAI API error:', e?.message || e);
    console.error('Timed out:', timedOut);
    throw new Error(`OpenAI API error: ${e?.message || 'Unknown error'}`);
  }
}
