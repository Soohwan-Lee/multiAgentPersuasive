'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProgressHeader } from '@/components/ProgressHeader';
import { CheckCircle, ExternalLink } from 'lucide-react';

export default function FinishPage() {
  const router = useRouter();
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const id = sessionStorage.getItem('participantId');
    if (!id) {
      router.push('/entry');
      return;
    }
    setParticipantId(id);

    // Mark participant as finished
    markParticipantFinished(id);
  }, [router]);

  const markParticipantFinished = async (pid: string) => {
    try {
      await fetch('/api/prolific/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId: pid }),
      });
    } catch (error) {
      console.error('Error marking participant as finished:', error);
    }
  };

  const handleRedirectToProlific = () => {
    const completionUrl = process.env.NEXT_PUBLIC_PROLIFIC_COMPLETION_URL || 'https://app.prolific.co/submissions/complete?cc=CBUP19R5';
    window.location.href = completionUrl;
  };

  const clearSessionData = () => {
    sessionStorage.clear();
  };

  if (!participantId) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <ProgressHeader
        currentStep="Completion"
        totalSteps={13}
        currentStepIndex={12}
      />

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
            Experiment Completed!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              Thank you for participating in our Multi-Agent Persuasive Experiment!
            </p>
            
            <div className="bg-green-50 p-4 rounded-lg mb-6">
              <h3 className="font-medium text-green-800 mb-2">Completion Code</h3>
              <p className="text-lg font-mono bg-white p-2 rounded border">
                {process.env.NEXT_PUBLIC_PROLIFIC_COMPLETION_CODE || 'CBUP19R5'}
              </p>
              <p className="text-sm text-green-700 mt-2">
                Please copy this code and submit it on Prolific to receive your payment.
              </p>
            </div>

            <div className="space-y-4">
              <Button 
                onClick={handleRedirectToProlific}
                size="lg"
                className="w-full"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Return to Prolific
              </Button>
            </div>
          </div>

          <div className="text-sm text-muted-foreground text-center">
            <p>
              Your responses have been recorded and will be used for research purposes.
              All data is anonymized and handled according to our privacy policy.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
