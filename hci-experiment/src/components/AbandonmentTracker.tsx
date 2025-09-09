'use client';

import { useEffect, useRef, useState } from 'react';

interface AbandonmentTrackerProps {
  participantId?: string | null;
  idleMinutes?: number; // 기본 30분
}

export function AbandonmentTracker({ participantId, idleMinutes = 30 }: AbandonmentTrackerProps) {
  const idleTimerRef = useRef<number | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const [resolvedPid, setResolvedPid] = useState<string | null>(participantId ?? null);

  // 1) participantId 동기화: sessionStorage에서 준비되면 감지
  useEffect(() => {
    if (participantId) {
      setResolvedPid(participantId);
      return;
    }
    let syncTimer: number | null = null;
    const sync = () => {
      try {
        const pid = typeof window !== 'undefined' ? sessionStorage.getItem('participantId') : null;
        if (pid && pid !== resolvedPid) setResolvedPid(pid);
      } catch {}
    };
    sync();
    syncTimer = window.setInterval(sync, 500);
    return () => { if (syncTimer) window.clearInterval(syncTimer); };
  }, [participantId, resolvedPid]);

  // 2) 이탈/비활성 감지
  useEffect(() => {
    const pid = resolvedPid;
    if (!pid) return;

    const release = () => {
      try {
        const payload = JSON.stringify({ participantId: pid, reason: 'beforeunload' });
        if (navigator.sendBeacon) {
          const blob = new Blob([payload], { type: 'application/json' });
          navigator.sendBeacon('/api/abort', blob);
        } else {
          fetch('/api/abort', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true }).catch(() => {});
        }
      } catch {}
    };

    const resetIdle = () => {
      lastActivityRef.current = Date.now();
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = window.setTimeout(() => {
        const payload = { participantId: pid, reason: 'idle-timeout' };
        fetch('/api/abort', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), keepalive: true }).catch(() => {});
      }, idleMinutes * 60 * 1000);
    };

    // 초기 타이머 시작
    resetIdle();

    // 사용자 활동 이벤트
    const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];
    events.forEach((ev) => window.addEventListener(ev, resetIdle, { passive: true }));

    // 페이지 이탈 감지
    window.addEventListener('beforeunload', release);

    return () => {
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
      events.forEach((ev) => window.removeEventListener(ev, resetIdle as any));
      window.removeEventListener('beforeunload', release as any);
    };
  }, [resolvedPid, idleMinutes]);

  return null;
}


