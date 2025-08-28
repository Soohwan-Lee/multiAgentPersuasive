'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProgressHeader } from '@/components/ProgressHeader';
import { MessageSquare, Users, Clock, Shield, SkipForward } from 'lucide-react';

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

  const handleSkip = () => {
    router.push('/survey/background');
  };

  if (!participantId) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <ProgressHeader
        currentStep="Introduction"
        totalSteps={13}
        currentStepIndex={1}
      />

      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            Welcome to the Multi-Agent Persuasive Experiment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <MessageSquare className="h-6 w-6 text-blue-600 mt-1" />
                <div>
                  <h3 className="font-semibold">Experiment Purpose</h3>
                  <p className="text-sm text-muted-foreground">
                    This experiment studies the persuasive effects of multiple AI agents. 
                    You will have conversations with agents holding different perspectives and observe decision-making processes.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Users className="h-6 w-6 text-green-600 mt-1" />
                <div>
                  <h3 className="font-semibold">Participation Method</h3>
                  <p className="text-sm text-muted-foreground">
                    There are 3 sessions with 4 cycles each. 
                    In each cycle, you send a message and 3 AI agents respond simultaneously.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Clock className="h-6 w-6 text-orange-600 mt-1" />
                <div>
                  <h3 className="font-semibold">Duration</h3>
                  <p className="text-sm text-muted-foreground">
                    The entire experiment takes approximately 20-30 minutes. 
                    Each cycle has time limits, so please respond carefully.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Shield className="h-6 w-6 text-purple-600 mt-1" />
                <div>
                  <h3 className="font-semibold">Privacy Protection</h3>
                  <p className="text-sm text-muted-foreground">
                    All responses are processed anonymously and used only for research purposes. 
                    You can stop the experiment at any time.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">⚠️ Important Notes</h3>
            <ul className="text-sm space-y-1">
              <li>• Do not close the browser or refresh during the experiment</li>
              <li>• Please respond within the time limit for each cycle</li>
              <li>• Have honest and natural conversations</li>
              <li>• Contact the experimenter if any problems occur</li>
            </ul>
          </div>

          <div className="text-center pt-4 space-y-3">
            <Button onClick={handleStart} size="lg">
              Start Experiment
            </Button>
            
            {/* TEST MODE SKIP BUTTON */}
            <div className="border-t pt-4">
              <Button 
                onClick={handleSkip}
                variant="outline"
                className="text-orange-600 border-orange-300 hover:bg-orange-50"
              >
                <SkipForward className="h-4 w-4 mr-2" />
                Skip to Background Survey (Test Mode)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
