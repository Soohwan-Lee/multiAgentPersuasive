import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

const responseRequestSchema = z.object({
  participantId: z.string().uuid(),
  sessionKey: z.enum(['test', 'main1', 'main2']),
  turnIndex: z.number().int().min(1).max(4),
  publicChoice: z.number().int().min(-50).max(50),
  publicConf: z.number().int().min(0).max(100),
  privateBelief: z.number().int().min(-50).max(50).optional(),
  privateConf: z.number().int().min(0).max(100).optional(),
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
    const { participantId, sessionKey, turnIndex, publicChoice, publicConf, privateBelief, privateConf, rtMs } = responseRequestSchema.parse(body);

    // Update the turn with response data
    const { error: updateError } = await supabase
      .from('turns')
      .update({
        public_choice: publicChoice,
        public_conf: publicConf,
        private_belief: privateBelief || null,
        private_conf: privateConf || null,
        rt_ms: rtMs,
      })
      .eq('participant_id', participantId)
      .eq('session_key', sessionKey)
      .eq('t_idx', turnIndex);

    if (updateError) {
      console.error('Response update error:', updateError);
      return NextResponse.json(
        { error: '응답 저장 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Response saved successfully'
    });

  } catch (error) {
    console.error('Response API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
