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

  const createTestParticipantInSupabase = async (testParticipantId: string) => {
    try {
      console.log('Creating test participant in Supabase:', testParticipantId);
      
      const response = await fetch('/api/participants/upsert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prolific_pid: 'TEST_PID',
          study_id: 'TEST_STUDY',
          session_id: 'TEST_SESSION',
          testMode: true,
          testParticipantId: testParticipantId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to create test participant:', errorData);
        return false;
      } else {
        const result = await response.json();
        console.log('Test participant created successfully:', result);
        
        // Create sessions for test participant
        await createTestSessions(testParticipantId);
        return true;
      }
    } catch (error) {
      console.error('Error creating test participant:', error);
      return false;
    }
  };

  const createTestSessions = async (participantId: string) => {
    try {
      console.log('Creating test sessions for participant:', participantId);
      
      // Create test session
      const testSessionResponse = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participant_id: participantId,
          session_key: 'test'
        }),
      });

      if (!testSessionResponse.ok) {
        console.error('Failed to create test session');
      } else {
        console.log('Test session created successfully');
      }

      // Create normative session
      const normativeSessionResponse = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participant_id: participantId,
          session_key: 'normative'
        }),
      });

      if (!normativeSessionResponse.ok) {
        console.error('Failed to create normative session');
      } else {
        console.log('Normative session created successfully');
      }

      // Create informative session
      const informativeSessionResponse = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participant_id: participantId,
          session_key: 'informative'
        }),
      });

      if (!informativeSessionResponse.ok) {
        console.error('Failed to create informative session');
      } else {
        console.log('Informative session created successfully');
      }

    } catch (error) {
      console.error('Error creating test sessions:', error);
    }
  };

  useEffect(() => {
    const initializeParticipant = async () => {
      const prolificPid = searchParams.get('PROLIFIC_PID');
      const studyId = searchParams.get('STUDY_ID');
      const sessionId = searchParams.get('SESSION_ID');

      // Check if we're in test mode (no Prolific parameters)
      const isTestMode = !prolificPid || !studyId || !sessionId;

              if (isTestMode) {
          // For testing, create a dummy participant with proper UUID
          const testParticipantId = crypto.randomUUID(); // Generate proper UUID
          
          // Create test participant in Supabase
          createTestParticipantInSupabase(testParticipantId);
          
          // Store in session storage
          sessionStorage.setItem('participantId', testParticipantId);
          sessionStorage.setItem('prolificPid', 'TEST_PID');
          sessionStorage.setItem('studyId', 'TEST_STUDY');
          sessionStorage.setItem('sessionId', 'TEST_SESSION');
          sessionStorage.setItem('isTestMode', 'true');
          
          // Go directly to introduction
          router.push('/introduction');
          return;
        }

      setIsLoading(true);
      setError(null);

      try {
        // Create/retrieve participant
        const response = await fetch('/api/participants/upsert', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prolific_pid: prolificPid,
            study_id: studyId,
            session_id: sessionId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Participant upsert failed:', errorData);
          throw new Error(`Failed to initialize participant: ${errorData.error || 'Unknown error'}`);
        }

        const result = await response.json();
        console.log('Participant upsert response:', result);

        if (!result.participant || !result.participant.id) {
          console.error('Invalid participant data received:', result);
          throw new Error('Invalid participant data received from server');
        }

        const { participant } = result;
        console.log('Participant created/retrieved:', {
          id: participant.id,
          prolific_pid: participant.prolific_pid,
          condition_type: participant.condition_type,
          task_order: participant.task_order
        });

        // Store participant info in session storage
        sessionStorage.setItem('participantId', participant.id);
        sessionStorage.setItem('prolificPid', prolificPid);
        sessionStorage.setItem('studyId', studyId);
        sessionStorage.setItem('sessionId', sessionId);
        sessionStorage.setItem('isTestMode', 'false');
        sessionStorage.setItem('participantData', JSON.stringify(participant));

        console.log('Session storage updated with participant ID:', participant.id);

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

  const handleSkip = () => {
    // Create test participant and skip to introduction
    const testParticipantId = crypto.randomUUID(); // Generate proper UUID
    
    // Create test participant in Supabase
    createTestParticipantInSupabase(testParticipantId);
    
    // Store in session storage
    sessionStorage.setItem('participantId', testParticipantId);
    sessionStorage.setItem('prolificPid', 'TEST_PID');
    sessionStorage.setItem('studyId', 'TEST_STUDY');
    sessionStorage.setItem('sessionId', 'TEST_SESSION');
    sessionStorage.setItem('isTestMode', 'true');
    router.push('/introduction');
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
            <p>This experiment studies the persuasive effects of multiple AI agents.</p>
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
