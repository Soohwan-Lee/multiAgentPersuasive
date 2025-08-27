'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface T0PanelProps {
  sessionKey: 'test' | 'normative' | 'informative'; // main1, main2를 normative, informative로 변경
  participantId: string;
  onComplete: () => void;
}

export function T0Panel({ sessionKey, participantId, onComplete }: T0PanelProps) {
  const [opinion, setOpinion] = useState(0);
  const [confidence, setConfidence] = useState(50);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime] = useState(Date.now());

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const rtMs = Date.now() - startTime;

    try {
      const response = await fetch('/api/t0', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participantId,
          sessionKey,
          publicChoice: opinion,
          publicConf: confidence,
          rtMs,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit t0 response');
      }

      onComplete();
    } catch (error) {
      console.error('T0 submission error:', error);
      alert('Failed to submit response. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Initial Response</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="opinion">
            Your opinion on Death Penalty: {opinion > 0 ? 'Support' : opinion < 0 ? 'Oppose' : 'Neutral'} ({opinion})
          </Label>
          <input
            id="opinion"
            type="range"
            min="-50"
            max="50"
            value={opinion}
            onChange={(e) => setOpinion(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Strongly Oppose</span>
            <span>Neutral</span>
            <span>Strongly Support</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confidence">
            Confidence in your opinion
          </Label>
          <input
            id="confidence"
            type="range"
            min="0"
            max="100"
            value={confidence}
            onChange={(e) => setConfidence(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Not at all confident</span>
            <span>Very confident</span>
          </div>
        </div>

        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Initial Response'}
        </Button>
      </CardContent>
    </Card>
  );
}
