import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';
import { runCycle } from '@/lib/orchestrator';

// Simple in-memory rate limiter (use Redis in production)
const rateLimitMap = new Map<string, number>();

const cycleRequestSchema = z.object({
  participantId: z.string(),
  sessionKey: z.enum(['test', 'main1', 'main2']),
  cycle: z.number().int().min(1).max(4),
  userMessage: z.string().min(1).max(1000),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { participantId, sessionKey, cycle, userMessage } = cycleRequestSchema.parse(body);

    // Check if this is test mode
    const isTestMode = participantId.startsWith('test-');

    if (isTestMode) {
      // For test mode, simulate agent responses without database
      console.log('Test mode cycle:', { participantId, sessionKey, cycle, userMessage });
      
      // Simulate agent responses
      const mockResponses = {
        agent1: "I understand your perspective. Let me share some thoughts on this topic.",
        agent2: "That's an interesting point. I think we should consider the broader implications.",
        agent3: "I see where you're coming from, but I'd like to offer a different viewpoint."
      };

      return NextResponse.json({
        agent1: mockResponses.agent1,
        agent2: mockResponses.agent2,
        agent3: mockResponses.agent3,
        meta: {
          cycle: cycle,
          session_key: sessionKey,
          participant_id: participantId,
          stances: { 1: 'support', 2: 'neutral', 3: 'oppose' },
          latencies: { agent1: 1200, agent2: 1100, agent3: 1300 },
        }
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

      return NextResponse.json({
        agent1: messages?.find((m: any) => m.role === 'agent1'),
        agent2: messages?.find((m: any) => m.role === 'agent2'),
        agent3: messages?.find((m: any) => m.role === 'agent3'),
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

    return NextResponse.json({
      agent1: result.agents.agent1,
      agent2: result.agents.agent2,
      agent3: result.agents.agent3,
      meta: {
        cycle: cycle,
        session_key: sessionKey,
        participant_id: participantId,
        stances: result.meta.stances,
        latencies: result.meta.latencies,
      }
    });

  } catch (error) {
    console.error('Cycle API error:', error);
    return NextResponse.json(
      { error: 'Server error occurred.' },
      { status: 500 }
    );
  }
}
