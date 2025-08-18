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
  { name: 'Entry', path: '/entry' },
  { name: 'Introduction', path: '/introduction' },
  { name: 'Background Survey', path: '/survey/background' },
  { name: 'Practice Session', path: '/session/test' },
  { name: 'Main Session 1', path: '/session/main1' },
  { name: 'Post-Self Survey 1', path: '/survey/post-self-1' },
  { name: 'Post-Open Survey 1', path: '/survey/post-open-1' },
  { name: 'Main Session 2', path: '/session/main2' },
  { name: 'Post-Self Survey 2', path: '/survey/post-self-2' },
  { name: 'Post-Open Survey 2', path: '/survey/post-open-2' },
  { name: 'Completion', path: '/finish' },
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
            <h2 className="text-lg font-semibold">Multi-Agent Persuasive Experiment</h2>
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
        </div>
      </CardContent>
    </Card>
  );
}
