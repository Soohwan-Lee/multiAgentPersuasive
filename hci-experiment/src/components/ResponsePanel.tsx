'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface ResponsePanelProps {
  turnIndex: number;
  participantId: string;
  sessionKey: 'test' | 'main1' | 'main2';
  onComplete: () => void;
  showPrivateBelief?: boolean;
}

export function ResponsePanel({ 
  turnIndex, 
  participantId, 
  sessionKey, 
  onComplete, 
  showPrivateBelief = false 
}: ResponsePanelProps) {
  const [publicChoice, setPublicChoice] = useState(0);
  const [publicConf, setPublicConf] = useState(50);
  const [privateBelief, setPrivateBelief] = useState(0);
  const [privateConf, setPrivateConf] = useState(50);
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
          turnIndex,
          publicChoice,
          publicConf,
          privateBelief: showPrivateBelief ? privateBelief : undefined,
          privateConf: showPrivateBelief ? privateConf : undefined,
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

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-center">Turn {turnIndex} Response</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="public-choice">
            Public opinion: {publicChoice > 0 ? 'Support' : publicChoice < 0 ? 'Oppose' : 'Neutral'} ({publicChoice})
          </Label>
          <input
            id="public-choice"
            type="range"
            min="-50"
            max="50"
            value={publicChoice}
            onChange={(e) => setPublicChoice(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Strongly Oppose</span>
            <span>Neutral</span>
            <span>Strongly Support</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="public-conf">
            Public confidence: {publicConf}%
          </Label>
          <input
            id="public-conf"
            type="range"
            min="0"
            max="100"
            value={publicConf}
            onChange={(e) => setPublicConf(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Not at all confident</span>
            <span>Very confident</span>
          </div>
        </div>

        {showPrivateBelief && (
          <>
            <div className="space-y-2">
              <Label htmlFor="private-belief">
                Private belief: {privateBelief > 0 ? 'Support' : privateBelief < 0 ? 'Oppose' : 'Neutral'} ({privateBelief})
              </Label>
              <input
                id="private-belief"
                type="range"
                min="-50"
                max="50"
                value={privateBelief}
                onChange={(e) => setPrivateBelief(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Strongly Oppose</span>
                <span>Neutral</span>
                <span>Strongly Support</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="private-conf">
                Private confidence: {privateConf}%
              </Label>
              <input
                id="private-conf"
                type="range"
                min="0"
                max="100"
                value={privateConf}
                onChange={(e) => setPrivateConf(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Not at all confident</span>
                <span>Very confident</span>
              </div>
            </div>
          </>
        )}

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
