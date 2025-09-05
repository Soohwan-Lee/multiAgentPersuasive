import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';
import { runCycle } from '@/lib/orchestrator';

// Simple in-memory rate limiter (use Redis in production)
const rateLimitMap = new Map<string, number>();

const cycleRequestSchema = z.object({
  participantId: z.string(),
  sessionKey: z.enum(['test', 'normative', 'informative']), // main1, main2를 normative, informative로 변경
  cycle: z.number().min(1).max(4),
  userMessage: z.string().min(1),
  currentTask: z.string().optional(), // 현재 논의할 주제
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { participantId, sessionKey, cycle, userMessage, currentTask } = cycleRequestSchema.parse(body);

    // Check if this is test mode
    const isTestMode = participantId.startsWith('test-');

    // Check environment variables for OpenAI API
    console.log('Environment check:', {
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      openAIKeyLength: process.env.OPENAI_API_KEY?.length || 0,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    });
    
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key not configured in environment');
      
      // Test mode에서 API 키가 없을 때 fallback 응답 제공
      if (isTestMode) {
        console.log('Providing fallback responses for test mode');
        return NextResponse.json({
          agent1: { content: "I understand your perspective on this topic." },
          agent2: { content: "That's an interesting point you've raised." },
          agent3: { content: "I see where you're coming from." },
          meta: {
            cycle: cycle,
            session_key: sessionKey,
            participant_id: participantId,
            stances: { 1: 'oppose', 2: 'oppose', 3: 'oppose' },
            latencies: { agent1: 100, agent2: 100, agent3: 100 }
          }
        });
      }
      
      return NextResponse.json(
        { error: 'OpenAI API key not configured.' },
        { status: 500 }
      );
    }

    if (isTestMode) {
      // For test mode, use actual OpenAI API but skip database operations
      console.log('Test mode cycle:', { participantId, sessionKey, cycle, userMessage });
      
      // Use orchestrator to get real agent responses
      const result = await runCycle({
        participantId,
        sessionKey,
        cycle,
        userMessage,
        currentTask: currentTask,
        isTestMode: true,
      });

      return NextResponse.json({
        agent1: result.agent1,
        agent2: result.agent2,
        agent3: result.agent3,
        meta: result.meta
      });
    }

    // Check environment variables for production mode
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Supabase configuration is incomplete.' },
        { status: 500 }
      );
    }

    // Rate limiting check (3 seconds per request)
    const rateLimitKey = `${participantId}:${sessionKey}`;
    const now = Date.now();
    const lastRequest = rateLimitMap.get(rateLimitKey);
    
    if (lastRequest && now - lastRequest < 3000) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait 3 seconds.' },
        { status: 429 }
      );
    }
    rateLimitMap.set(rateLimitKey, now);

    // Check if cycle already exists (idempotency)
    const { data: existingTurn } = await supabase
      .from('turns')
      .select('*')
      .eq('participant_id', participantId)
      .eq('session_key', sessionKey)
      .eq('cycle', cycle)
      .single();

    if (existingTurn) {
      // Get existing messages for this cycle
      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .eq('participant_id', participantId)
        .eq('session_key', sessionKey)
        .eq('cycle', cycle)
        .order('ts', { ascending: true });

      const agent1Msg = messages?.find((m: any) => m.role === 'agent1');
      const agent2Msg = messages?.find((m: any) => m.role === 'agent2');
      const agent3Msg = messages?.find((m: any) => m.role === 'agent3');

      return NextResponse.json({
        agent1: agent1Msg ? {
          content: agent1Msg.content,
          latency_ms: agent1Msg.latency_ms,
          token_in: agent1Msg.token_in,
          token_out: agent1Msg.token_out,
          fallback_used: agent1Msg.fallback_used
        } : null,
        agent2: agent2Msg ? {
          content: agent2Msg.content,
          latency_ms: agent2Msg.latency_ms,
          token_in: agent2Msg.token_in,
          token_out: agent2Msg.token_out,
          fallback_used: agent2Msg.fallback_used
        } : null,
        agent3: agent3Msg ? {
          content: agent3Msg.content,
          latency_ms: agent3Msg.latency_ms,
          token_in: agent3Msg.token_in,
          token_out: agent3Msg.token_out,
          fallback_used: agent3Msg.fallback_used
        } : null,
        meta: {
          cycle: cycle,
          session_key: sessionKey,
          participant_id: participantId,
        }
      });
    }

    // Check guard: cycle k can only be called after response k-1 is saved
    const requiredResponseIndex = cycle - 1;
    const { data: requiredResponse } = await supabase
      .from('responses')
      .select('*')
      .eq('participant_id', participantId)
      .eq('session_key', sessionKey)
      .eq('response_index', requiredResponseIndex)
      .single();

    if (!requiredResponse) {
      return NextResponse.json(
        { error: `Response T${requiredResponseIndex} must be completed before starting cycle ${cycle}.` },
        { status: 400 }
      );
    }

    // Save user message
    const { error: userMsgError } = await supabase
      .from('messages')
      .insert({
        id: crypto.randomUUID(),
        participant_id: participantId,
        session_key: sessionKey,
        cycle: cycle,
        role: 'user',
        content: userMessage,
      });

    if (userMsgError) {
      console.error('User message save error:', userMsgError);
    }

    // Run the chat cycle
    const result = await runCycle({
      participantId,
      sessionKey,
      cycle,
      userMessage,
      currentTask: currentTask,
    });

    console.log('Cycle result:', {
      agent1Content: result.agent1?.content?.substring(0, 50) + '...',
      agent2Content: result.agent2?.content?.substring(0, 50) + '...',
      agent3Content: result.agent3?.content?.substring(0, 50) + '...',
      meta: result.meta
    });

    // Update session current_cycle
    const { error: sessionError } = await supabase
      .from('sessions')
      .update({ current_cycle: cycle })
      .eq('participant_id', participantId)
      .eq('key', sessionKey);

    if (sessionError) {
      console.error('Session update error:', sessionError);
    }

    const response = {
      agent1: result.agent1,
      agent2: result.agent2,
      agent3: result.agent3,
      meta: result.meta
    };

    console.log('Sending response to client:', {
      agent1Exists: !!response.agent1,
      agent2Exists: !!response.agent2,
      agent3Exists: !!response.agent3,
      agent1ContentLength: response.agent1?.content?.length || 0,
      agent2ContentLength: response.agent2?.content?.length || 0,
      agent3ContentLength: response.agent3?.content?.length || 0,
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('Cycle API error:', error);
    
    // 더 자세한 에러 정보 제공
    let errorMessage = 'Server error occurred.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
