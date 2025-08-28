'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProgressHeader } from '@/components/ProgressHeader';
import { Target, CheckCircle, ArrowRight, AlertTriangle } from 'lucide-react';
import { getFirstSession } from '@/config/session-order';

export default function SessionTransitionPage() {
  const router = useRouter();
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const storedParticipantId = sessionStorage.getItem('participantId');
    if (!storedParticipantId) {
      router.push('/entry');
      return;
    }
    setParticipantId(storedParticipantId);
  }, [router]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      // 자동으로 다음 세션으로 이동
      router.push(`/session/${getFirstSession()}`);
    }
  }, [countdown, router]);

  const handleContinue = () => {
    router.push(`/session/${getFirstSession()}`);
  };

  const handleSkip = () => {
    router.push(`/session/${getFirstSession()}`);
  };

  if (!participantId) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <ProgressHeader
        currentStep="Session Transition"
        totalSteps={13}
        currentStepIndex={4} // 테스트와 본 실험 사이
      />

      <Card className="max-w-3xl mx-auto border-2 border-green-200 bg-green-50">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 p-3 rounded-full">
              <Target className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl text-green-800">
            🎯 본 실험 시작 준비 완료!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <div className="bg-white/70 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-2 text-green-800">
                테스트 세션이 완료되었습니다
              </h3>
              <p className="text-green-700 mb-4">
                이제 인터페이스 사용법을 익히셨으니, 실제 실험이 시작됩니다.
              </p>
              
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-left">
                    <h4 className="font-medium text-yellow-800 mb-2">중요 안내사항</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• 이제부터 실제 실험입니다</li>
                      <li>• 진지하고 솔직하게 응답해주세요</li>
                      <li>• AI 에이전트와의 대화에 집중해주세요</li>
                      <li>• 모든 응답은 연구 목적으로만 사용됩니다</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-2">다음 세션 정보</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <p><strong>세션:</strong> {getFirstSession() === 'normative' ? 'Normative Session' : 'Informative Session'}</p>
                <p><strong>목적:</strong> {getFirstSession() === 'normative' ? '규범적 논증과 사회적 가치에 초점' : '정보적 논증과 사실적 증거에 초점'}</p>
                <p><strong>구성:</strong> 4회차 연속 대화 (T0-T4)</p>
              </div>
            </div>
          </div>

          <div className="text-center space-y-4">
            <div className="bg-white/70 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">
                {countdown}초 후 자동으로 다음 세션으로 이동합니다
              </p>
              <Button 
                onClick={handleContinue} 
                size="lg"
                className="bg-green-600 hover:bg-green-700"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                지금 시작하기
              </Button>
            </div>

            {/* TEST MODE SKIP BUTTON */}
            <div className="border-t pt-4">
              <Button 
                onClick={handleSkip}
                variant="outline"
                className="text-orange-600 border-orange-300 hover:bg-orange-50"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Skip to Main Session (Test Mode)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
