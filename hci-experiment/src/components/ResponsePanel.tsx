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
  
  // Track if sliders have been moved from their initial positions
  const [opinionMoved, setOpinionMoved] = useState(false);
  const [confidenceMoved, setConfidenceMoved] = useState(false);

  const handleOpinionChange = (value: number) => {
    setOpinion(value);
    if (!opinionMoved) {
      setOpinionMoved(true);
    }
  };

  const handleConfidenceChange = (value: number) => {
    setConfidence(value);
    if (!confidenceMoved) {
      setConfidenceMoved(true);
    }
  };

  const handleSubmit = async () => {
    // Check if both sliders have been moved
    if (!opinionMoved || !confidenceMoved) {
      const missingMoves = [];
      if (!opinionMoved) missingMoves.push('opinion slider');
      if (!confidenceMoved) missingMoves.push('confidence slider');
      
      alert(`Please move the ${missingMoves.join(' and ')} before submitting your response.`);
      return;
    }

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
            {!opinionMoved && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <input
            id="opinion"
            type="range"
            min="-50"
            max="50"
            value={opinion}
            onChange={(e) => handleOpinionChange(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Strongly Oppose</span>
            <span>Neutral</span>
            <span>Strongly Support</span>
          </div>
          {!opinionMoved && (
            <p className="text-xs text-red-500">Please move the opinion slider to indicate your position</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confidence">
            Confidence in your opinion
            {!confidenceMoved && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <input
            id="confidence"
            type="range"
            min="0"
            max="100"
            value={confidence}
            onChange={(e) => handleConfidenceChange(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Not at all confident</span>
            <span>Very confident</span>
          </div>
          {!confidenceMoved && (
            <p className="text-xs text-red-500">Please move the confidence slider to indicate your confidence level</p>
          )}
        </div>

        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting || !opinionMoved || !confidenceMoved}
          className="w-full"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Response'}
        </Button>
        
        {(!opinionMoved || !confidenceMoved) && (
          <p className="text-xs text-muted-foreground text-center">
            Please move both sliders before submitting
          </p>
        )}
      </CardContent>
    </Card>
  );
}
