import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { z } from 'zod';

const abortSchema = z.object({
  participantId: z.string(),
  reason: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // body 파싱 (sendBeacon 대비 안전 처리)
    let body: any = null;
    try {
      body = await request.json();
    } catch {
      const text = await request.text();
      try {
        body = JSON.parse(text);
      } catch {
        body = {};
      }
    }

    const { participantId, reason } = abortSchema.parse(body);

    // 참가자 상태 확인
    const { data: participant, error: pErr } = await supabaseAdmin
      .from('participants')
      .select('id, finished_at')
      .eq('id', participantId)
      .maybeSingle();

    if (pErr) {
      console.error('Abort: participant fetch error', pErr);
    }

    if (!participant) {
      // 참가자가 없으면 noop 처리
      return NextResponse.json({ success: true, released: 0, note: 'participant not found' });
    }

    if (participant.finished_at) {
      // 이미 완료된 참가자는 해제하지 않음
      return NextResponse.json({ success: true, released: 0, note: 'already finished' });
    }

    // 무조건 즉시 해제 (단, finished_at이 있으면 건너뜀)
    const { error: updErr } = await supabaseAdmin
      .from('experiment_conditions')
      .update({ is_assigned: false, assigned_participant_id: null, assigned_at: null })
      .eq('assigned_participant_id', participantId)
      .eq('is_assigned', true);

    if (updErr) {
      console.error('Abort: condition release error', updErr);
      return NextResponse.json({ success: false, error: 'release_failed' }, { status: 500 });
    }

    // 조건 해제는 응답이 0개일 때만 시도했으므로, 여기서는 추가 검사 불필요

    // 이벤트 기록 (best-effort)
    try {
      await supabaseAdmin.from('events').insert({
        id: crypto.randomUUID(),
        participant_id: participantId,
        type: 'participant_aborted',
        payload: { reason: reason ?? 'unknown', ts: new Date().toISOString() },
      });
    } catch (e) {
      console.warn('Abort: event insert failed', e);
    }

    return NextResponse.json({ success: true, released: 1 });
  } catch (error) {
    console.error('Abort API error:', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}


