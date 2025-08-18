import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { MessageSquare, CheckCircle, Circle } from 'lucide-react';

interface ProgressHeaderProps {
  currentStep: string;
  totalSteps: number;
  currentStepIndex: number;
  sessionName?: string;
  turnNumber?: number;
}

const steps = [
  { name: '입장', path: '/entry' },
  { name: '소개', path: '/introduction' },
  { name: '배경 설문', path: '/survey/background' },
  { name: '테스트 세션', path: '/session/test' },
  { name: '메인 세션 1', path: '/session/main1' },
  { name: '메인 세션 2', path: '/session/main2' },
  { name: '자기보고 설문', path: '/survey/post-self' },
  { name: '개방형 설문', path: '/survey/post-open' },
  { name: '완료', path: '/finish' },
];

export function ProgressHeader({ 
  currentStep, 
  totalSteps, 
  currentStepIndex,
  sessionName,
  turnNumber 
}: ProgressHeaderProps) {
  const progressPercentage = (currentStepIndex / (totalSteps - 1)) * 100;

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold">다중 에이전트 설득 실험</h2>
          </div>
          {sessionName && turnNumber && (
            <div className="text-sm text-muted-foreground">
              {sessionName} - 턴 {turnNumber}/4
            </div>
          )}
        </div>
        
        <Progress value={progressPercentage} className="mb-4" />
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            진행률: {Math.round(progressPercentage)}%
          </span>
          <span className="font-medium">
            {currentStepIndex + 1} / {totalSteps}
          </span>
        </div>
        
        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <span>현재 단계: {currentStep}</span>
        </div>
      </CardContent>
    </Card>
  );
}
