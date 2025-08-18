'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProgressHeader } from '@/components/ProgressHeader';
import { MessageSquare, Users, Clock, Shield } from 'lucide-react';

export default function IntroductionPage() {
  const router = useRouter();
  const [participantId, setParticipantId] = useState<string | null>(null);

  useEffect(() => {
    const storedParticipantId = sessionStorage.getItem('participantId');
    if (!storedParticipantId) {
      router.push('/entry');
      return;
    }
    setParticipantId(storedParticipantId);
  }, [router]);

  const handleStart = () => {
    router.push('/survey/background');
  };

  if (!participantId) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <ProgressHeader
        currentStep="소개"
        totalSteps={9}
        currentStepIndex={1}
      />

      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            다중 에이전트 설득 실험에 오신 것을 환영합니다
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <MessageSquare className="h-6 w-6 text-blue-600 mt-1" />
                <div>
                  <h3 className="font-semibold">실험 목적</h3>
                  <p className="text-sm text-muted-foreground">
                    이 실험은 여러 AI 에이전트의 설득 효과를 연구하는 것입니다. 
                    서로 다른 관점을 가진 에이전트들과 대화하며 의사결정 과정을 관찰합니다.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Users className="h-6 w-6 text-green-600 mt-1" />
                <div>
                  <h3 className="font-semibold">참가 방법</h3>
                  <p className="text-sm text-muted-foreground">
                    총 3개의 세션에서 각각 4턴씩 진행됩니다. 
                    각 턴마다 메시지를 보내면 3명의 AI 에이전트가 동시에 응답합니다.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Clock className="h-6 w-6 text-orange-600 mt-1" />
                <div>
                  <h3 className="font-semibold">소요 시간</h3>
                  <p className="text-sm text-muted-foreground">
                    전체 실험은 약 20-30분 정도 소요됩니다. 
                    각 턴은 시간 제한이 있으니 신중하게 응답해주세요.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Shield className="h-6 w-6 text-purple-600 mt-1" />
                <div>
                  <h3 className="font-semibold">개인정보 보호</h3>
                  <p className="text-sm text-muted-foreground">
                    모든 응답은 익명으로 처리되며, 연구 목적으로만 사용됩니다. 
                    언제든지 실험을 중단할 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">⚠️ 주의사항</h3>
            <ul className="text-sm space-y-1">
              <li>• 실험 중에는 브라우저를 닫거나 새로고침하지 마세요</li>
              <li>• 각 턴마다 정해진 시간 내에 응답해주세요</li>
              <li>• 솔직하고 자연스러운 대화를 나누어주세요</li>
              <li>• 문제가 발생하면 실험자에게 연락해주세요</li>
            </ul>
          </div>

          <div className="text-center pt-4">
            <Button onClick={handleStart} size="lg">
              실험 시작하기
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
