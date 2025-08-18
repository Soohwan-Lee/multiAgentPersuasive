'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProgressHeader } from '@/components/ProgressHeader';

export default function FinishPage() {
  const router = useRouter();
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [completionCode, setCompletionCode] = useState<string>('');
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    const storedParticipantId = sessionStorage.getItem('participantId');
    if (!storedParticipantId) {
      router.push('/entry');
      return;
    }
    setParticipantId(storedParticipantId);
    setCompletionCode(process.env.NEXT_PUBLIC_PROLIFIC_COMPLETION_CODE || 'COMPLETION_CODE');
  }, [router]);

  const handleComplete = async () => {
    if (!participantId) return;
    
    setIsCompleting(true);
    try {
      // Mark participant as finished
      await fetch('/api/prolific/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId })
      });

      // Clear session storage
      sessionStorage.removeItem('participantId');

      // Redirect to Prolific
      const prolificUrl = `https://app.prolific.com/submissions/complete?cc=${completionCode}`;
      window.location.href = prolificUrl;
    } catch (error) {
      console.error('Completion error:', error);
      alert('Failed to complete experiment. Please try again.');
      setIsCompleting(false);
    }
  };

  if (!participantId) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <ProgressHeader
        currentStep="Experiment Complete"
        totalSteps={9}
        currentStepIndex={9}
      />

      <Card>
        <CardHeader>
          <CardTitle>Experiment Complete!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <p className="text-lg">
              Thank you for participating in our experiment!
            </p>
            <p className="text-muted-foreground">
              Your responses have been recorded and will help us understand how people interact with AI agents in decision-making contexts.
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 mb-2">Completion Code</h3>
            <p className="text-green-700 font-mono text-lg">
              {completionCode}
            </p>
            <p className="text-sm text-green-600 mt-2">
              Please copy this code and paste it in Prolific to receive your payment.
            </p>
          </div>

          <div className="space-y-4">
            <Button 
              onClick={handleComplete} 
              disabled={isCompleting}
              className="w-full"
              size="lg"
            >
              {isCompleting ? 'Completing...' : 'Return to Prolific'}
            </Button>
            
            <p className="text-xs text-muted-foreground text-center">
              Clicking this button will redirect you back to Prolific with your completion code.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
