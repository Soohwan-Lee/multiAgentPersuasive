import { NextRequest, NextResponse } from 'next/server';
import { saveMessage, getSessionMessages } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { participant_id, session_id, cycle, role, content, latency_ms, token_in, token_out, fallback_used } = await request.json();

    if (!participant_id || !session_id || !cycle || !role || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['user', 'agent1', 'agent2', 'agent3'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Save message
    const message = await saveMessage({
      participant_id,
      session_id,
      cycle,
      role,
      content,
      latency_ms,
      token_in,
      token_out,
      fallback_used: fallback_used || false,
    });

    if (!message) {
      return NextResponse.json(
        { error: 'Failed to save message' },
        { status: 500 }
      );
    }

    return NextResponse.json(message);
  } catch (error) {
    console.error('Error saving message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const session_id = searchParams.get('session_id');

    if (!session_id) {
      return NextResponse.json(
        { error: 'Missing session_id parameter' },
        { status: 400 }
      );
    }

    const messages = await getSessionMessages(session_id);
    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
