'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ProgressHeader } from '@/components/ProgressHeader';

export default function PostOpenSurvey1Page() {
  const router = useRouter();
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Survey responses
  const [thoughts, setThoughts] = useState('');
  const [agentComparison, setAgentComparison] = useState('');
  const [suggestions, setSuggestions] = useState('');

  useEffect(() => {
    const id = sessionStorage.getItem('participantId');
    setParticipantId(id);
  }, []);

  const handleSubmit = async () => {
    if (!participantId) return;

    setIsSubmitting(true);

    try {
      // Log survey responses
      await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId,
          type: 'post_open_survey_1',
          payload: {
            thoughts,
            agentComparison,
            suggestions,
            taskType: 'main1' // Will be updated to specific task type later
          }
        })
      });

      // Navigate to next page
      router.push('/session/main2');
    } catch (error) {
      console.error('Error submitting survey:', error);
      alert('Failed to submit survey. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!participantId) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <ProgressHeader
        currentStep="Post-Open Survey 1"
        totalSteps={11}
        currentStepIndex={6}
      />

      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            Post-Session Open-Ended Survey (Session 1)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="text-center mb-6">
            <p className="text-muted-foreground">
              Please share your thoughts and experiences from the previous session.
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="thoughts">
                What were your general thoughts about the experiment and the AI agents?
              </Label>
              <Textarea
                id="thoughts"
                placeholder="Please share your thoughts..."
                value={thoughts}
                onChange={(e) => setThoughts(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="comparison">
                How would you compare the different AI agents? Did any stand out to you?
              </Label>
              <Textarea
                id="comparison"
                placeholder="Please compare the agents..."
                value={agentComparison}
                onChange={(e) => setAgentComparison(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="suggestions">
                Do you have any suggestions for improving the experiment or the AI agents?
              </Label>
              <Textarea
                id="suggestions"
                placeholder="Please share any suggestions..."
                value={suggestions}
                onChange={(e) => setSuggestions(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>

          <div className="text-center pt-6">
            <Button onClick={handleSubmit} disabled={isSubmitting} size="lg">
              {isSubmitting ? 'Submitting...' : 'Continue to Next Session'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
