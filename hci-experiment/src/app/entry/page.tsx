'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProgressHeader } from '@/components/ProgressHeader';
import { Loader2, CheckCircle, SkipForward } from 'lucide-react';

function EntryPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeParticipant = async () => {
      const prolificPid = searchParams.get('PROLIFIC_PID');
      const studyId = searchParams.get('STUDY_ID');
      const sessionId = searchParams.get('SESSION_ID');

      setIsLoading(true);
      setError(null);

      try {
        // Always call upsert: when Prolific params missing, send dummy values
        const response = await fetch('/api/participants/upsert', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prolific_pid: prolificPid ?? `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            study_id: studyId ?? 'TEST_STUDY',
            session_id: sessionId ?? 'TEST_SESSION',
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to initialize participant.');
        }

        const { participant } = await response.json();

        // Store participant info in session storage
        sessionStorage.setItem('participantId', participant.id);
        sessionStorage.setItem('prolificPid', prolificPid ?? 'TEST_PID');
        sessionStorage.setItem('studyId', studyId ?? 'TEST_STUDY');
        sessionStorage.setItem('sessionId', sessionId ?? 'TEST_SESSION');
        sessionStorage.setItem('isTestMode', (!prolificPid || !studyId || !sessionId) ? 'true' : 'false');

        // Go to introduction page
        router.push('/introduction');

      } catch (err) {
        console.error('Participant initialization error:', err);
        setError('Error occurred during participant initialization. Please refresh the page.');
      } finally {
        setIsLoading(false);
      }
    };

    initializeParticipant();
  }, [searchParams, router]);

  const handleSkip = async () => {
    // Create a dummy participant via upsert, then proceed
    try {
      setIsLoading(true);
      const response = await fetch('/api/participants/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prolific_pid: `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          study_id: 'TEST_STUDY',
          session_id: 'TEST_SESSION',
        }),
      });
      if (!response.ok) throw new Error('Failed to initialize test participant');
      const { participant } = await response.json();
      sessionStorage.setItem('participantId', participant.id);
      sessionStorage.setItem('prolificPid', 'TEST_PID');
      sessionStorage.setItem('studyId', 'TEST_STUDY');
      sessionStorage.setItem('sessionId', 'TEST_SESSION');
      sessionStorage.setItem('isTestMode', 'true');
      router.push('/introduction');
    } catch (e) {
      console.error(e);
      setError('Failed to start test mode');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <ProgressHeader
        currentStep="Entry"
        totalSteps={13}
        currentStepIndex={0}
      />

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            Welcome to the Experiment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Initializing participant information...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-600 mb-4">
                <p className="font-medium">An error occurred</p>
                <p className="text-sm mt-2">{error}</p>
              </div>
              <Button 
                onClick={() => window.location.reload()}
                variant="outline"
              >
                Refresh Page
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-4" />
              <p>Participant information has been successfully registered.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Redirecting to introduction page...
              </p>
            </div>
          )}

          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Experiment Information</h3>
            <div className="text-sm space-y-1">
              <p><strong>Prolific ID:</strong> {searchParams.get('PROLIFIC_PID') || 'TEST MODE'}</p>
              <p><strong>Study ID:</strong> {searchParams.get('STUDY_ID') || 'TEST MODE'}</p>
              <p><strong>Session ID:</strong> {searchParams.get('SESSION_ID') || 'TEST MODE'}</p>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>This study looks at decision-making after short chats with multiple AI assistants.</p>
            <p className="mt-2">
              Please do not close the browser or refresh during the experiment.
              All responses are processed anonymously.
            </p>
          </div>

          {/* TEST MODE SKIP BUTTON */}
          <div className="border-t pt-4">
            <Button 
              onClick={handleSkip}
              variant="outline"
              className="w-full text-orange-600 border-orange-300 hover:bg-orange-50"
            >
              <SkipForward className="h-4 w-4 mr-2" />
              Skip to Introduction (Test Mode)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function EntryPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading page...</p>
        </div>
      </div>
    }>
      <EntryPageContent />
    </Suspense>
  );
}
