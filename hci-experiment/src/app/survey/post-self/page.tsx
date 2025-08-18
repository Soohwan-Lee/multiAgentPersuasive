'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ProgressHeader } from '@/components/ProgressHeader';

export default function PostSelfSurveyPage() {
  const router = useRouter();
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    persuasion_effectiveness: 50,
    agent_credibility: 50,
    decision_confidence: 50,
    overall_satisfaction: 50
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const storedParticipantId = sessionStorage.getItem('participantId');
    if (!storedParticipantId) {
      router.push('/entry');
      return;
    }
    setParticipantId(storedParticipantId);
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Log survey completion
      await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId,
          type: 'survey_post_self_completed',
          payload: formData
        })
      });

      router.push('/survey/post-open');
    } catch (error) {
      console.error('Survey submission error:', error);
      alert('Failed to submit survey. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!participantId) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <ProgressHeader
        currentStep="Post-Experiment Survey"
        totalSteps={9}
        currentStepIndex={7}
      />

      <Card>
        <CardHeader>
          <CardTitle>Post-Experiment Self-Report</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-4">
              <Label htmlFor="persuasion_effectiveness">
                How effective were the agents at persuading you? ({formData.persuasion_effectiveness}%)
              </Label>
              <input
                id="persuasion_effectiveness"
                type="range"
                min="0"
                max="100"
                value={formData.persuasion_effectiveness}
                onChange={(e) => setFormData({ ...formData, persuasion_effectiveness: Number(e.target.value) })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Not at all effective</span>
                <span>Very effective</span>
              </div>
            </div>

            <div className="space-y-4">
              <Label htmlFor="agent_credibility">
                How credible did you find the agents? ({formData.agent_credibility}%)
              </Label>
              <input
                id="agent_credibility"
                type="range"
                min="0"
                max="100"
                value={formData.agent_credibility}
                onChange={(e) => setFormData({ ...formData, agent_credibility: Number(e.target.value) })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Not at all credible</span>
                <span>Very credible</span>
              </div>
            </div>

            <div className="space-y-4">
              <Label htmlFor="decision_confidence">
                How confident are you in your final decision? ({formData.decision_confidence}%)
              </Label>
              <input
                id="decision_confidence"
                type="range"
                min="0"
                max="100"
                value={formData.decision_confidence}
                onChange={(e) => setFormData({ ...formData, decision_confidence: Number(e.target.value) })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Not at all confident</span>
                <span>Very confident</span>
              </div>
            </div>

            <div className="space-y-4">
              <Label htmlFor="overall_satisfaction">
                Overall satisfaction with the experiment? ({formData.overall_satisfaction}%)
              </Label>
              <input
                id="overall_satisfaction"
                type="range"
                min="0"
                max="100"
                value={formData.overall_satisfaction}
                onChange={(e) => setFormData({ ...formData, overall_satisfaction: Number(e.target.value) })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Very dissatisfied</span>
                <span>Very satisfied</span>
              </div>
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Submitting...' : 'Continue to Open-Ended Survey'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
