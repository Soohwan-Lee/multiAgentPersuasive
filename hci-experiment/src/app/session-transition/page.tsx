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

      <Card className="max-w-3xl mx-auto border-2 border-gray-200 bg-gray-50">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-gray-100 p-3 rounded-full">
              <Target className="h-8 w-8 text-gray-600" />
            </div>
          </div>
          <CardTitle className="text-2xl text-gray-800">
            🎯 Main Experiment Ready!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <div className="bg-white/70 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-2 text-gray-800">
                Test session completed
              </h3>
              <p className="text-gray-700 mb-4">
                Now that you have learned how to use the interface, the actual experiment will begin.
              </p>
              
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-left">
                    <h4 className="font-medium text-yellow-800 mb-2">Important Information</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• This is now the actual experiment</li>
                      <li>• Please respond seriously and honestly</li>
                      <li>• Focus on your conversations with AI agents</li>
                      <li>• All responses are used for research purposes only</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-2">Next Session Information</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <p><strong>Session:</strong> Main Experiment Session</p>
                <p><strong>Purpose:</strong> Study the effects of AI agent interactions</p>
                <p><strong>Structure:</strong> 4 consecutive conversations (T0-T4)</p>
              </div>
            </div>
          </div>

          <div className="text-center space-y-4">
            <div className="bg-white/70 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">
                Automatically proceeding to the next session in {countdown} seconds
              </p>
              <Button 
                onClick={handleContinue} 
                size="lg"
                className="bg-gray-600 hover:bg-gray-700"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Start Now
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
