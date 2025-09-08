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

import { getFirstSession, getSecondSession } from '@/config/session-order';

const steps = [
  { name: 'Entry', path: '/entry', description: 'Participant Registration' },
  { name: 'Introduction', path: '/introduction', description: 'Experiment Introduction' },
  { name: 'Background Survey', path: '/survey/background', description: 'Background Survey' },
  { name: '🧪 Practice Session', path: '/session/test', description: 'Test Session (Tutorial)' },
  { name: 'Session Transition', path: '/session-transition', description: 'Main Experiment Preparation' },
  { name: '🎯 Main Session 1', path: `/session/${getFirstSession()}`, description: 'Main Experiment Session 1' },
  { name: 'Post-Self Survey 1', path: '/survey/post-self-1', description: 'Self-Report Survey 1' },
  { name: 'Post-Open Survey 1', path: '/survey/post-open-1', description: 'Open-Ended Survey 1' },
  { name: 'Session Transition 2', path: '/session-transition-2', description: 'Second Main Experiment Preparation' },
  { name: '🎯 Main Session 2', path: `/session/${getSecondSession()}`, description: 'Main Experiment Session 2' },
  { name: 'Post-Self Survey 2', path: '/survey/post-self-2', description: 'Self-Report Survey 2' },
  { name: 'Post-Open Survey 2', path: '/survey/post-open-2', description: 'Open-Ended Survey 2' },
  { name: 'Completion', path: '/finish', description: 'Experiment Completion' },
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
            <h2 className="text-lg font-semibold">Multi-Agent Chat Experiment</h2>
          </div>
          {sessionName && turnNumber && (
            <div className="text-sm text-muted-foreground">
              {sessionName} - Turn {turnNumber}/4
            </div>
          )}
        </div>
        
        <Progress value={progressPercentage} className="mb-4" />
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Progress: {Math.round(progressPercentage)}%
          </span>
          <span className="font-medium">
            {currentStepIndex + 1} / {totalSteps}
          </span>
        </div>
        
        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <span>Current Step: {currentStep}</span>
          <span>{steps[currentStepIndex]?.description || ''}</span>
        </div>
      </CardContent>
    </Card>
  );
}
