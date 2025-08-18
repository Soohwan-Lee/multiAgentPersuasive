'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ProgressHeader } from '@/components/ProgressHeader';

export default function PostOpenSurveyPage() {
  const router = useRouter();
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    thoughts_on_experiment: '',
    agent_comparison: '',
    suggestions: ''
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
          type: 'survey_post_open_completed',
          payload: formData
        })
      });

      router.push('/finish');
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
        currentStep="Open-Ended Survey"
        totalSteps={9}
        currentStepIndex={8}
      />

      <Card>
        <CardHeader>
          <CardTitle>Open-Ended Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="thoughts_on_experiment">
                What are your thoughts on the experiment? (Optional)
              </Label>
              <Textarea
                id="thoughts_on_experiment"
                placeholder="Please share your general thoughts about the experiment, what you found interesting, confusing, or surprising..."
                value={formData.thoughts_on_experiment}
                onChange={(e) => setFormData({ ...formData, thoughts_on_experiment: e.target.value })}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="agent_comparison">
                How would you compare the different agents? (Optional)
              </Label>
              <Textarea
                id="agent_comparison"
                placeholder="Did you notice differences between the agents? Which ones seemed more persuasive, credible, or helpful?"
                value={formData.agent_comparison}
                onChange={(e) => setFormData({ ...formData, agent_comparison: e.target.value })}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="suggestions">
                Do you have any suggestions for improving the experiment? (Optional)
              </Label>
              <Textarea
                id="suggestions"
                placeholder="Any suggestions for making the experiment better, clearer, or more engaging?"
                value={formData.suggestions}
                onChange={(e) => setFormData({ ...formData, suggestions: e.target.value })}
                rows={4}
              />
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Submitting...' : 'Complete Experiment'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
