'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProgressHeader } from '@/components/ProgressHeader';
import { Loader2, CheckCircle } from 'lucide-react';

export default function EntryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeParticipant = async () => {
      const prolificPid = searchParams.get('PROLIFIC_PID');
      const studyId = searchParams.get('STUDY_ID');
      const sessionId = searchParams.get('SESSION_ID');

      if (!prolificPid || !studyId || !sessionId) {
        setError('필수 Prolific 파라미터가 누락되었습니다.');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // 참가자 생성/조회
        const response = await fetch('/api/participants/upsert', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prolific_pid: prolificPid,
            study_id: studyId,
            session_id: sessionId,
          }),
        });

        if (!response.ok) {
          throw new Error('참가자 초기화에 실패했습니다.');
        }

        const { participant } = await response.json();

        // 세션 스토리지에 참가자 정보 저장
        sessionStorage.setItem('participantId', participant.id);
        sessionStorage.setItem('prolificPid', prolificPid);
        sessionStorage.setItem('studyId', studyId);
        sessionStorage.setItem('sessionId', sessionId);

        // 소개 페이지로 이동
        router.push('/introduction');

      } catch (err) {
        console.error('Participant initialization error:', err);
        setError('참가자 초기화 중 오류가 발생했습니다. 페이지를 새로고침해주세요.');
      } finally {
        setIsLoading(false);
      }
    };

    initializeParticipant();
  }, [searchParams, router]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <ProgressHeader
        currentStep="입장"
        totalSteps={9}
        currentStepIndex={0}
      />

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            실험 참가 환영
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>참가자 정보를 초기화하고 있습니다...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-600 mb-4">
                <p className="font-medium">오류가 발생했습니다</p>
                <p className="text-sm mt-2">{error}</p>
              </div>
              <Button 
                onClick={() => window.location.reload()}
                variant="outline"
              >
                페이지 새로고침
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-4" />
              <p>참가자 정보가 성공적으로 등록되었습니다.</p>
              <p className="text-sm text-muted-foreground mt-2">
                잠시 후 소개 페이지로 이동합니다...
              </p>
            </div>
          )}

          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">실험 정보</h3>
            <div className="text-sm space-y-1">
              <p><strong>Prolific ID:</strong> {searchParams.get('PROLIFIC_PID') || 'N/A'}</p>
              <p><strong>Study ID:</strong> {searchParams.get('STUDY_ID') || 'N/A'}</p>
              <p><strong>Session ID:</strong> {searchParams.get('SESSION_ID') || 'N/A'}</p>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>이 실험은 다중 에이전트 설득 효과를 연구하는 온라인 실험입니다.</p>
            <p className="mt-2">
              실험 진행 중에는 브라우저를 닫거나 새로고침하지 마세요.
              모든 응답은 익명으로 처리됩니다.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
