import { AgentResponse } from './types';

// OpenAI API 호출 함수
async function callOpenAI(systemPrompt: string, userMessage: string): Promise<AgentResponse> {
  const startTime = Date.now();
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const latency = Date.now() - startTime;
    
    return {
      content: data.choices[0].message.content,
      latency_ms: latency,
      token_in: data.usage?.prompt_tokens,
      token_out: data.usage?.completion_tokens,
      fallback_used: false,
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    
    // 12초 타임아웃 또는 에러 시 폴백 응답
    if (latency > 12000 || error) {
      return {
        content: "죄송합니다. 현재 응답을 생성할 수 없습니다. 잠시 후 다시 시도해주세요.",
        latency_ms: latency,
        fallback_used: true,
      };
    }
    
    throw error;
  }
}

// 다중 에이전트 오케스트레이션 (legacy - 현재는 사용되지 않음)
export async function orchestrateAgents(userMessage: string): Promise<{
  agent1: AgentResponse;
  agent2: AgentResponse;
  agent3: AgentResponse;
}> {
  // 기본 프롬프트 (실제로는 prompts.ts의 buildSystemPrompt 사용)
  const systemPrompt = "You are an AI agent. Express your opinion clearly and concisely in one sentence.";
  
  // 3개 에이전트를 병렬로 호출
  const [agent1Response, agent2Response, agent3Response] = await Promise.allSettled([
    callOpenAI(systemPrompt, userMessage),
    callOpenAI(systemPrompt, userMessage),
    callOpenAI(systemPrompt, userMessage),
  ]);

  // 각 응답을 처리 (실패 시 폴백)
  const processResponse = (result: PromiseSettledResult<AgentResponse>, agentName: string): AgentResponse => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        content: `${agentName} 에이전트가 일시적으로 응답할 수 없습니다.`,
        latency_ms: 12000,
        fallback_used: true,
      };
    }
  };

  return {
    agent1: processResponse(agent1Response, 'Agent 1'),
    agent2: processResponse(agent2Response, 'Agent 2'),
    agent3: processResponse(agent3Response, 'Agent 3'),
  };
}
