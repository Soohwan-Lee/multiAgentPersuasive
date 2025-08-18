'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface ResponsePanelProps {
  responseIndex: number;
  participantId: string;
  sessionKey: 'test' | 'main1' | 'main2';
  onComplete: () => void;
}

export function ResponsePanel({ 
  responseIndex, 
  participantId, 
  sessionKey, 
  onComplete 
}: ResponsePanelProps) {
  const [opinion, setOpinion] = useState(0);
  const [confidence, setConfidence] = useState(50);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime] = useState(Date.now());

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const rtMs = Date.now() - startTime;

    try {
      const response = await fetch('/api/response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participantId,
          sessionKey,
          responseIndex,
          opinion,
          confidence,
          rtMs,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit response');
      }

      onComplete();
    } catch (error) {
      console.error('Response submission error:', error);
      alert('Failed to submit response. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getResponseTitle = () => {
    if (responseIndex === 0) return 'Initial Response (T0)';
    return `Response T${responseIndex}`;
  };

  const getOpinionLabel = () => {
    if (opinion > 0) return `Support (${opinion})`;
    if (opinion < 0) return `Oppose (${opinion})`;
    return `Neutral (${opinion})`;
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-center">{getResponseTitle()}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="opinion">
            Your opinion on Death Penalty: {getOpinionLabel()}
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
            Confidence in your opinion: {confidence}%
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
          {isSubmitting ? 'Submitting...' : 'Submit Response'}
        </Button>
      </CardContent>
    </Card>
  );
}
