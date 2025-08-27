import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

const t0RequestSchema = z.object({
  participantId: z.string(),
  sessionKey: z.enum(['test', 'normative', 'informative']), // main1, main2를 normative, informative로 변경
  publicChoice: z.number().int().min(-50).max(50),
  publicConf: z.number().int().min(0).max(100),
  rtMs: z.number().int().min(0),
});

export async function POST(request: NextRequest) {
  try {
    // 환경 변수 체크
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Supabase 설정이 완료되지 않았습니다.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { participantId, sessionKey, publicChoice, publicConf, rtMs } = t0RequestSchema.parse(body);

    // Check if t0 already exists
    const { data: existingT0 } = await supabase
      .from('turns')
      .select('*')
      .eq('participant_id', participantId)
      .eq('session_key', sessionKey)
      .eq('t_idx', 0)
      .single();

    if (existingT0) {
      return NextResponse.json({ 
        success: true, 
        message: 't0 already exists',
        turn: existingT0 
      });
    }

    // Create t0 turn
    const turnId = crypto.randomUUID();
    const { data: newTurn, error: turnError } = await supabase
      .from('turns')
      .insert({
        id: turnId,
        participant_id: participantId,
        session_key: sessionKey,
        t_idx: 0,
        user_msg: null,
        public_choice: publicChoice,
        public_conf: publicConf,
        rt_ms: rtMs,
      })
      .select()
      .single();

    if (turnError) {
      console.error('t0 creation error:', turnError);
      return NextResponse.json(
        { error: 't0 생성 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // Update session started_at if not set
    await supabase
      .from('sessions')
      .update({ started_at: new Date().toISOString() })
      .eq('participant_id', participantId)
      .eq('key', sessionKey)
      .is('started_at', null);

    return NextResponse.json({ 
      success: true, 
      turn: newTurn 
    });

  } catch (error) {
    console.error('t0 API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
