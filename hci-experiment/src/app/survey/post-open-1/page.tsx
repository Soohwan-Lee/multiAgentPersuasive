'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ProgressHeader } from '@/components/ProgressHeader';
import { SkipForward } from 'lucide-react';

export default function PostOpenSurvey1Page() {
  const router = useRouter();
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 하드코딩된 조건 - 테스트용으로 minorityDiffusion 설정
  const condition: string = "minorityDiffusion";
  
  // Survey responses
  const [basisOfDecision, setBasisOfDecision] = useState('');
  const [reasonForChange, setReasonForChange] = useState('');
  const [internalInconsistency, setInternalInconsistency] = useState('');
  const [experienceByPattern, setExperienceByPattern] = useState('');
  const [other, setOther] = useState('');

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
            basisOfDecision,
            reasonForChange,
            internalInconsistency,
            experienceByPattern,
            other,
            condition,
            taskType: 'main1'
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

  const handleSkip = () => {
    router.push('/session/main2');
  };

  const getPatternQuestion = () => {
    switch (condition) {
      case 'majority':
        return "When all the AIs expressed different opinions, how did you feel, and how did that affect your judgment or trust?";
      case 'minority':
        return "When one AI consistently expressed a different opinion, how did you feel differently compared to the agreeing AIs, and how did that affect your judgment or trust?";
      case 'minorityDiffusion':
        return "When other AIs started to align with an initially minority opinion, how did you feel, and how did that affect your judgment or trust?";
      default:
        return "Please describe your experience with the AI agents during this session.";
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
              <Label htmlFor="basis-of-decision">
                What was the most important factor when making your final decision in this session? (e.g., the AI's arguments, my initial thoughts, the nature of the task, etc.) Please briefly explain the reason.
              </Label>
              <Textarea
                id="basis-of-decision"
                placeholder="Please explain your decision-making process..."
                value={basisOfDecision}
                onChange={(e) => setBasisOfDecision(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason-for-change">
                When comparing your initial opinion (T0) with your final opinion (T4), what explains why your opinion was maintained or changed? In particular, please describe which aspect(s) of the AI's statements influenced you.
              </Label>
              <Textarea
                id="reason-for-change"
                placeholder="Please describe what influenced your opinion change or maintenance..."
                value={reasonForChange}
                onChange={(e) => setReasonForChange(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="internal-inconsistency">
                If there was a difference between the answer you publicly submitted and the 'true' answer you held privately, what do you think caused that difference?
              </Label>
              <Textarea
                id="internal-inconsistency"
                placeholder="Please explain any differences between your public and private answers..."
                value={internalInconsistency}
                onChange={(e) => setInternalInconsistency(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience-by-pattern">
                {getPatternQuestion()}
              </Label>
              <Textarea
                id="experience-by-pattern"
                placeholder="Please describe your experience with the influence pattern..."
                value={experienceByPattern}
                onChange={(e) => setExperienceByPattern(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="other">
                Please feel free to share anything unexpected or particularly interesting you experienced during the session.
              </Label>
              <Textarea
                id="other"
                placeholder="Please share any additional thoughts or experiences..."
                value={other}
                onChange={(e) => setOther(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>

          <div className="text-center pt-6 space-y-3">
            <Button onClick={handleSubmit} disabled={isSubmitting} size="lg">
              {isSubmitting ? 'Submitting...' : 'Continue to Next Session'}
            </Button>
            
            {/* TEST MODE SKIP BUTTON */}
            <div className="border-t pt-4">
              <Button 
                onClick={handleSkip}
                variant="outline"
                className="text-orange-600 border-orange-300 hover:bg-orange-50"
              >
                <SkipForward className="h-4 w-4 mr-2" />
                Skip to Next Session (Test Mode)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
