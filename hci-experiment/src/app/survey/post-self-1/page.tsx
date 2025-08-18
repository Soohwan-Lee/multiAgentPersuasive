'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ProgressHeader } from '@/components/ProgressHeader';

export default function PostSelfSurvey1Page() {
  const router = useRouter();
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Survey responses
  const [persuasionEffectiveness, setPersuasionEffectiveness] = useState(50);
  const [agentCredibility, setAgentCredibility] = useState(50);
  const [decisionConfidence, setDecisionConfidence] = useState(50);
  const [overallSatisfaction, setOverallSatisfaction] = useState(50);

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
          type: 'post_self_survey_1',
          payload: {
            persuasionEffectiveness,
            agentCredibility,
            decisionConfidence,
            overallSatisfaction,
            taskType: 'main1' // Will be updated to specific task type later
          }
        })
      });

      // Navigate to next page
      router.push('/survey/post-open-1');
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
        currentStep="Post-Self Survey 1"
        totalSteps={11}
        currentStepIndex={5}
      />

      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            Post-Session Self-Report Survey (Session 1)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="text-center mb-6">
            <p className="text-muted-foreground">
              Please rate your experience during the previous session with the AI agents.
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="persuasion">
                How effective were the agents at persuading you? ({persuasionEffectiveness}%)
              </Label>
              <input
                id="persuasion"
                type="range"
                min="0"
                max="100"
                value={persuasionEffectiveness}
                onChange={(e) => setPersuasionEffectiveness(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Not at all effective</span>
                <span>Very effective</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="credibility">
                How credible did you find the agents? ({agentCredibility}%)
              </Label>
              <input
                id="credibility"
                type="range"
                min="0"
                max="100"
                value={agentCredibility}
                onChange={(e) => setAgentCredibility(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Not credible at all</span>
                <span>Very credible</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confidence">
                How confident are you in your final decision? ({decisionConfidence}%)
              </Label>
              <input
                id="confidence"
                type="range"
                min="0"
                max="100"
                value={decisionConfidence}
                onChange={(e) => setDecisionConfidence(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Not confident at all</span>
                <span>Very confident</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="satisfaction">
                Overall satisfaction with the session? ({overallSatisfaction}%)
              </Label>
              <input
                id="satisfaction"
                type="range"
                min="0"
                max="100"
                value={overallSatisfaction}
                onChange={(e) => setOverallSatisfaction(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Very dissatisfied</span>
                <span>Very satisfied</span>
              </div>
            </div>
          </div>

          <div className="text-center pt-6">
            <Button onClick={handleSubmit} disabled={isSubmitting} size="lg">
              {isSubmitting ? 'Submitting...' : 'Continue'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
