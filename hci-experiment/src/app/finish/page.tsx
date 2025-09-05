'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProgressHeader } from '@/components/ProgressHeader';
import { CheckCircle, ExternalLink, AlertCircle } from 'lucide-react';

export default function FinishPage() {
  const router = useRouter();
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

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
    setIsSubmitting(true);
    setSubmissionStatus('idle');
    setErrorMessage('');

    try {
      console.log('Submitting completion for participant:', pid);
      
      const response = await fetch('/api/prolific/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId: pid }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log('Successfully marked participant as finished');
        setSubmissionStatus('success');
        
        // 추가 데이터 정리 작업
        await cleanupSessionData(pid);
        
      } else {
        console.error('Failed to mark participant as finished:', result.error);
        setSubmissionStatus('error');
        setErrorMessage(result.error || 'Failed to complete experiment');
      }
    } catch (error) {
      console.error('Error marking participant as finished:', error);
      setSubmissionStatus('error');
      setErrorMessage('Network error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const cleanupSessionData = async (pid: string) => {
    try {
      // 세션 데이터 정리 (필요한 경우)
      console.log('Cleaning up session data for participant:', pid);
      
      // 여기에 추가적인 정리 작업을 추가할 수 있습니다
      // 예: 로컬 스토리지 정리, 캐시 정리 등
      
    } catch (error) {
      console.warn('Session cleanup failed:', error);
    }
  };

  const handleRedirectToProlific = () => {
    const completionUrl = process.env.NEXT_PUBLIC_PROLIFIC_COMPLETION_URL || 'https://app.prolific.co/submissions/complete?cc=COMPLETION_CODE';
    window.location.href = completionUrl;
  };

  const clearSessionData = () => {
    sessionStorage.clear();
    localStorage.clear();
    console.log('Session and local storage cleared');
  };

  const retrySubmission = () => {
    if (participantId) {
      markParticipantFinished(participantId);
    }
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
            
            {/* Submission Status */}
            {submissionStatus === 'idle' && isSubmitting && (
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <p className="text-blue-800">Saving your responses...</p>
              </div>
            )}

            {submissionStatus === 'success' && (
              <div className="bg-green-50 p-4 rounded-lg mb-6">
                <h3 className="font-medium text-green-800 mb-2">Completion Code</h3>
                <p className="text-lg font-mono bg-white p-2 rounded border">
                  {process.env.NEXT_PUBLIC_PROLIFIC_COMPLETION_CODE || 'COMPLETION_CODE'}
                </p>
                <p className="text-sm text-green-700 mt-2">
                  Please copy this code and submit it on Prolific to receive your payment.
                </p>
              </div>
            )}

            {submissionStatus === 'error' && (
              <div className="bg-red-50 p-4 rounded-lg mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <h3 className="font-medium text-red-800">Submission Error</h3>
                </div>
                <p className="text-red-700 mb-3">{errorMessage}</p>
                <Button 
                  onClick={retrySubmission}
                  variant="outline"
                  size="sm"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Retrying...' : 'Retry Submission'}
                </Button>
              </div>
            )}

            <div className="space-y-4">
              {submissionStatus === 'success' && (
                <Button 
                  onClick={handleRedirectToProlific}
                  size="lg"
                  className="w-full"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Return to Prolific
                </Button>
              )}
              
              <Button 
                onClick={clearSessionData}
                variant="outline"
                size="sm"
                className="w-full"
              >
                Clear Session Data
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
