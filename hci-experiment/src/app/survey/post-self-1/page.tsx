'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ProgressHeader } from '@/components/ProgressHeader';
import { SkipForward } from 'lucide-react';

interface SurveyResponses {
  // Perceived Compliance (모든 조건에 공통)
  perceivedCompliance1: number;
  perceivedCompliance2: number;
  perceivedCompliance3: number;
  perceivedCompliance4: number;
  
  // Perceived Conversion (모든 조건에 공통)
  perceivedConversion1: number;
  perceivedConversion2: number;
  perceivedConversion3: number;
  perceivedConversion4: number;
  
  // AI Agent 인식 (Minority Influence & Minority Diffusion 조건에만)
  agent1Competence?: number;
  agent1Predictability?: number;
  agent1Integrity?: number;
  agent1Understanding?: number;
  agent1Utility?: number;
  agent1Affect?: number;
  agent1Trust?: number;
  
  agent2Competence?: number;
  agent2Predictability?: number;
  agent2Integrity?: number;
  agent2Understanding?: number;
  agent2Utility?: number;
  agent2Affect?: number;
  agent2Trust?: number;
  
  agent3Competence?: number;
  agent3Predictability?: number;
  agent3Integrity?: number;
  agent3Understanding?: number;
  agent3Utility?: number;
  agent3Affect?: number;
  agent3Trust?: number;
}

export default function PostSelfSurvey1Page() {
  const router = useRouter();
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [condition, setCondition] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Survey responses - 모든 필드를 4로 초기화 (7-point Likert scale의 중간값)
  const [responses, setResponses] = useState<SurveyResponses>({
    // Perceived Compliance
    perceivedCompliance1: 4,
    perceivedCompliance2: 4,
    perceivedCompliance3: 4,
    perceivedCompliance4: 4,
    
    // Perceived Conversion
    perceivedConversion1: 4,
    perceivedConversion2: 4,
    perceivedConversion3: 4,
    perceivedConversion4: 4,
  });

  useEffect(() => {
    const loadParticipantData = async () => {
      const id = sessionStorage.getItem('participantId');
      if (!id) {
        router.push('/entry');
        return;
      }
      
      setParticipantId(id);
      
      try {
        // 참가자 조건 가져오기
        const conditionResponse = await fetch(`/api/participants/condition?participantId=${id}`);
        if (conditionResponse.ok) {
          const { condition: participantCondition } = await conditionResponse.json();
          setCondition(participantCondition);
        }
      } catch (error) {
        console.error('Error loading participant condition:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadParticipantData();
  }, [router]);

  const updateResponse = (field: keyof SurveyResponses, value: number) => {
    setResponses(prev => ({
      ...prev,
      [field]: value
    }));
  };

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
            ...responses,
            condition,
            taskType: 'main1'
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

  const handleSkip = () => {
    router.push('/survey/post-open-1');
  };

  const render7PointLikert = (
    value: number, 
    onChange: (value: number) => void, 
    label: string,
    required: boolean = true
  ) => (
    <div className="space-y-2">
      <Label htmlFor={label.replace(/\s+/g, '-').toLowerCase()}>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <div className="flex items-center space-x-4">
        <input
          type="range"
          min="1"
          max="7"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1"
          required={required}
        />
        <span className="text-sm font-medium min-w-[3rem] text-center">{value}</span>
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Strongly Disagree</span>
        <span>Strongly Agree</span>
      </div>
    </div>
  );

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8 max-w-4xl">Loading...</div>;
  }

  if (!participantId) {
    return <div>Loading...</div>;
  }

  const isMinorityCondition = condition === 'minority' || condition === 'minorityDiffusion';

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <ProgressHeader
        currentStep="Post-Self Survey 1"
        totalSteps={11}
        currentStepIndex={5}
      />

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            Post-Session Self-Report Survey (Session 1)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="text-center mb-6">
            <p className="text-muted-foreground">
              Please rate your experience during the previous session with the AI agents.
              All questions marked with * are required.
            </p>
          </div>

          {/* Perceived Compliance Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold border-b pb-2">Perceived Compliance</h3>
            <p className="text-sm text-muted-foreground">
              Please indicate how much you agree or disagree with each statement about your behavior during the discussion.
            </p>
            
            {render7PointLikert(
              responses.perceivedCompliance1,
              (value) => updateResponse('perceivedCompliance1', value),
              "I immediately adjusted my public response after seeing the majority's answers."
            )}
            
            {render7PointLikert(
              responses.perceivedCompliance2,
              (value) => updateResponse('perceivedCompliance2', value),
              "I changed my overt stance to avoid conflict or evaluation."
            )}
            
            {render7PointLikert(
              responses.perceivedCompliance3,
              (value) => updateResponse('perceivedCompliance3', value),
              "If responding privately/anonymously, I would have answered differently."
            )}
            
            {render7PointLikert(
              responses.perceivedCompliance4,
              (value) => updateResponse('perceivedCompliance4', value),
              "The change felt temporary, likely to revert once the chat ends."
            )}
          </div>

          {/* Perceived Conversion Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold border-b pb-2">Perceived Conversion</h3>
            <p className="text-sm text-muted-foreground">
              Please indicate how much you agree or disagree with each statement about how your thinking changed during the discussion.
            </p>
            
            {render7PointLikert(
              responses.perceivedConversion1,
              (value) => updateResponse('perceivedConversion1', value),
              "After evaluating the minority's arguments, my evaluation criteria changed."
            )}
            
            {render7PointLikert(
              responses.perceivedConversion2,
              (value) => updateResponse('perceivedConversion2', value),
              "I would endorse the current position even in private."
            )}
            
            {render7PointLikert(
              responses.perceivedConversion3,
              (value) => updateResponse('perceivedConversion3', value),
              "Even after the discussion, the argument kept working on me and my stance strengthened over time."
            )}
            
            {render7PointLikert(
              responses.perceivedConversion4,
              (value) => updateResponse('perceivedConversion4', value),
              "I will apply these criteria to similar problems (or maintain the same choice tomorrow)."
            )}
          </div>

          {/* AI Agent 인식 Section - Minority 조건에만 표시 */}
          {isMinorityCondition && (
            <>
              {/* Agent 1 & 2 인식 */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold border-b pb-2">Perception of Agent 1 & Agent 2</h3>
                <p className="text-sm text-muted-foreground">
                  Please rate your perception of the first two agents (Agent 1 and Agent 2) during the discussion.
                </p>
                
                {render7PointLikert(
                  responses.agent1Competence || 4,
                  (value) => updateResponse('agent1Competence', value),
                  "The agents' suggestions are generally accurate and professional."
                )}
                
                {render7PointLikert(
                  responses.agent1Predictability || 4,
                  (value) => updateResponse('agent1Predictability', value),
                  "The agents' outputs are predictable and consistent."
                )}
                
                {render7PointLikert(
                  responses.agent1Integrity || 4,
                  (value) => updateResponse('agent1Integrity', value),
                  "The agents' claims are fair and balanced."
                )}
                
                {render7PointLikert(
                  responses.agent1Understanding || 4,
                  (value) => updateResponse('agent1Understanding', value),
                  "The agents understood what I was trying to say."
                )}
                
                {render7PointLikert(
                  responses.agent1Utility || 4,
                  (value) => updateResponse('agent1Utility', value),
                  "The agents (their functions) are useful to me."
                )}
                
                {render7PointLikert(
                  responses.agent1Affect || 4,
                  (value) => updateResponse('agent1Affect', value),
                  "I find these agents likable."
                )}
                
                {render7PointLikert(
                  responses.agent1Trust || 4,
                  (value) => updateResponse('agent1Trust', value),
                  "Overall, I trust these agents."
                )}
              </div>

              {/* Agent 3 인식 */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold border-b pb-2">Perception of Agent 3</h3>
                <p className="text-sm text-muted-foreground">
                  Please rate your perception of the third agent (Agent 3) during the discussion.
                </p>
                
                {render7PointLikert(
                  responses.agent3Competence || 4,
                  (value) => updateResponse('agent3Competence', value),
                  "The agent's suggestions are generally accurate and professional."
                )}
                
                {render7PointLikert(
                  responses.agent3Predictability || 4,
                  (value) => updateResponse('agent3Predictability', value),
                  "The agent's outputs are predictable and consistent."
                )}
                
                {render7PointLikert(
                  responses.agent3Integrity || 4,
                  (value) => updateResponse('agent3Integrity', value),
                  "The agent's claims are fair and balanced."
                )}
                
                {render7PointLikert(
                  responses.agent3Understanding || 4,
                  (value) => updateResponse('agent3Understanding', value),
                  "The agent understood what I was trying to say."
                )}
                
                {render7PointLikert(
                  responses.agent3Utility || 4,
                  (value) => updateResponse('agent3Utility', value),
                  "The agent (its functions) is useful to me."
                )}
                
                {render7PointLikert(
                  responses.agent3Affect || 4,
                  (value) => updateResponse('agent3Affect', value),
                  "I find this agent likable."
                )}
                
                {render7PointLikert(
                  responses.agent3Trust || 4,
                  (value) => updateResponse('agent3Trust', value),
                  "Overall, I trust this agent."
                )}
              </div>
            </>
          )}

          <div className="text-center pt-6 space-y-3">
            <Button onClick={handleSubmit} disabled={isSubmitting} size="lg">
              {isSubmitting ? 'Submitting...' : 'Continue'}
            </Button>
            
            {/* TEST MODE SKIP BUTTON */}
            <div className="border-t pt-4">
              <Button 
                onClick={handleSkip}
                variant="outline"
                className="text-orange-600 border-orange-300 hover:bg-orange-50"
              >
                <SkipForward className="h-4 w-4 mr-2" />
                Skip to Open Questions (Test Mode)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
