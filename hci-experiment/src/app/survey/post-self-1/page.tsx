'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ProgressHeader } from '@/components/ProgressHeader';
import { SkipForward } from 'lucide-react';
import { CURRENT_PATTERN } from '@/config/patterns';
import { getFirstSession } from '@/config/session-order';

interface SurveyResponses {
  // Perceived Compliance (모든 조건에 공통)
  perceivedCompliance1: number | null;
  perceivedCompliance2: number | null;
  perceivedCompliance3: number | null;
  perceivedCompliance4: number | null;
  
  // Perceived Conversion (모든 조건에 공통)
  perceivedConversion1: number | null;
  perceivedConversion2: number | null;
  perceivedConversion3: number | null;
  perceivedConversion4: number | null;
  
  // AI Agent 인식 (조건에 따라 다름)
  // Majority 조건: 모든 에이전트에 대한 7개 항목
  agentCompetence?: number | null;
  agentPredictability?: number | null;
  agentIntegrity?: number | null;
  agentUnderstanding?: number | null;
  agentUtility?: number | null;
  agentAffect?: number | null;
  agentTrust?: number | null;
  
  // Minority & MinorityDiffusion 조건: Agent 1&2와 Agent 3 분리
  agent1Competence?: number | null;
  agent1Predictability?: number | null;
  agent1Integrity?: number | null;
  agent1Understanding?: number | null;
  agent1Utility?: number | null;
  agent1Affect?: number | null;
  agent1Trust?: number | null;
  
  agent3Competence?: number | null;
  agent3Predictability?: number | null;
  agent3Integrity?: number | null;
  agent3Understanding?: number | null;
  agent3Utility?: number | null;
  agent3Affect?: number | null;
  agent3Trust?: number | null;
  
  // Concentration Test (모든 조건에 공통)
  concentrationTest: number | null;
}

export default function PostSelfSurvey1Page() {
  const router = useRouter();
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 참가자의 실제 condition_type을 우선 사용, 없으면 CURRENT_PATTERN 사용
  const [condition, setCondition] = useState<string>(CURRENT_PATTERN);
  
  // Survey responses - 모든 필드를 null로 초기화
  const [responses, setResponses] = useState<SurveyResponses>({
    // Perceived Compliance
    perceivedCompliance1: null,
    perceivedCompliance2: null,
    perceivedCompliance3: null,
    perceivedCompliance4: null,
    
    // Perceived Conversion
    perceivedConversion1: null,
    perceivedConversion2: null,
    perceivedConversion3: null,
    perceivedConversion4: null,
    
    // Concentration Test
    concentrationTest: null,
  });

  useEffect(() => {
    const id = sessionStorage.getItem('participantId');
    if (!id) {
      router.push('/entry');
      return;
    }
    setParticipantId(id);

    // 실제 condition_type 조회
    (async () => {
      try {
        const res = await fetch(`/api/participants/condition?participantId=${id}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.condition) setCondition(data.condition);
        }
      } catch (e) {
        console.error('Failed to load participant condition_type:', e);
      }
    })();
  }, [router]);

  const updateResponse = (field: keyof SurveyResponses, value: number) => {
    setResponses(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    const errors: string[] = [];

    // Perceived Compliance validation
    if (responses.perceivedCompliance1 === null) errors.push('Please answer Perceived Compliance question 1');
    if (responses.perceivedCompliance2 === null) errors.push('Please answer Perceived Compliance question 2');
    if (responses.perceivedCompliance3 === null) errors.push('Please answer Perceived Compliance question 3');
    if (responses.perceivedCompliance4 === null) errors.push('Please answer Perceived Compliance question 4');

    // Perceived Conversion validation
    if (responses.perceivedConversion1 === null) errors.push('Please answer Perceived Conversion question 1');
    if (responses.perceivedConversion2 === null) errors.push('Please answer Perceived Conversion question 2');
    if (responses.perceivedConversion3 === null) errors.push('Please answer Perceived Conversion question 3');
    if (responses.perceivedConversion4 === null) errors.push('Please answer Perceived Conversion question 4');

    // Concentration Test validation
    if (responses.concentrationTest === null) errors.push('Please answer the concentration test question');

    // AI Agent 인식 validation (조건에 따라 다름)
    if (condition === 'majority') {
      // Majority 조건: 모든 에이전트에 대한 7개 항목
      if (responses.agentCompetence === null) errors.push('Please answer Agent Competence question');
      if (responses.agentPredictability === null) errors.push('Please answer Agent Predictability question');
      if (responses.agentIntegrity === null) errors.push('Please answer Agent Integrity question');
      if (responses.agentUnderstanding === null) errors.push('Please answer Agent Understanding question');
      if (responses.agentUtility === null) errors.push('Please answer Agent Utility question');
      if (responses.agentAffect === null) errors.push('Please answer Agent Affect question');
      if (responses.agentTrust === null) errors.push('Please answer Agent Trust question');
    } else if (condition === 'minority' || condition === 'minorityDiffusion') {
      // Minority 조건: Agent 1&2와 Agent 3 분리
      // Agent 1 & 2 인식
      if (responses.agent1Competence === null) errors.push('Please answer Agent 1 & 2 Competence question');
      if (responses.agent1Predictability === null) errors.push('Please answer Agent 1 & 2 Predictability question');
      if (responses.agent1Integrity === null) errors.push('Please answer Agent 1 & 2 Integrity question');
      if (responses.agent1Understanding === null) errors.push('Please answer Agent 1 & 2 Understanding question');
      if (responses.agent1Utility === null) errors.push('Please answer Agent 1 & 2 Utility question');
      if (responses.agent1Affect === null) errors.push('Please answer Agent 1 & 2 Affect question');
      if (responses.agent1Trust === null) errors.push('Please answer Agent 1 & 2 Trust question');

      // Agent 3 인식
      if (responses.agent3Competence === null) errors.push('Please answer Agent 3 Competence question');
      if (responses.agent3Predictability === null) errors.push('Please answer Agent 3 Predictability question');
      if (responses.agent3Integrity === null) errors.push('Please answer Agent 3 Integrity question');
      if (responses.agent3Understanding === null) errors.push('Please answer Agent 3 Understanding question');
      if (responses.agent3Utility === null) errors.push('Please answer Agent 3 Utility question');
      if (responses.agent3Affect === null) errors.push('Please answer Agent 3 Affect question');
      if (responses.agent3Trust === null) errors.push('Please answer Agent 3 Trust question');
    }

    return errors;
  };

  const handleSubmit = async () => {
    if (!participantId) return;

    const errors = validateForm();
    if (errors.length > 0) {
      alert(`Please complete all required fields:\n\n${errors.join('\n')}`);
      return;
    }

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
            taskType: getFirstSession()
          }
        })
      });

      // Persist to dedicated table
      await fetch('/api/surveys/post-self', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participant_id: participantId,
          survey_number: 1,
          perceived_compliance_1: responses.perceivedCompliance1,
          perceived_compliance_2: responses.perceivedCompliance2,
          perceived_compliance_3: responses.perceivedCompliance3,
          perceived_compliance_4: responses.perceivedCompliance4,
          perceived_conversion_1: responses.perceivedConversion1,
          perceived_conversion_2: responses.perceivedConversion2,
          perceived_conversion_3: responses.perceivedConversion3,
          perceived_conversion_4: responses.perceivedConversion4,
          concentration_test: responses.concentrationTest,
          // condition-dependent optional fields
          agent_competence: responses.agentCompetence ?? undefined,
          agent_predictability: responses.agentPredictability ?? undefined,
          agent_integrity: responses.agentIntegrity ?? undefined,
          agent_understanding: responses.agentUnderstanding ?? undefined,
          agent_utility: responses.agentUtility ?? undefined,
          agent_affect: responses.agentAffect ?? undefined,
          agent_trust: responses.agentTrust ?? undefined,
          agent1_competence: responses.agent1Competence ?? undefined,
          agent1_predictability: responses.agent1Predictability ?? undefined,
          agent1_integrity: responses.agent1Integrity ?? undefined,
          agent1_understanding: responses.agent1Understanding ?? undefined,
          agent1_utility: responses.agent1Utility ?? undefined,
          agent1_affect: responses.agent1Affect ?? undefined,
          agent1_trust: responses.agent1Trust ?? undefined,
          agent3_competence: responses.agent3Competence ?? undefined,
          agent3_predictability: responses.agent3Predictability ?? undefined,
          agent3_integrity: responses.agent3Integrity ?? undefined,
          agent3_understanding: responses.agent3Understanding ?? undefined,
          agent3_utility: responses.agent3Utility ?? undefined,
          agent3_affect: responses.agent3Affect ?? undefined,
          agent3_trust: responses.agent3Trust ?? undefined,
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
    value: number | null, 
    onChange: (value: number) => void, 
    label: string
  ) => (
    <div className="space-y-3">
      <Label className="text-sm font-medium">{label} *</Label>
      <div className="grid grid-cols-7 gap-2">
        {[1, 2, 3, 4, 5, 6, 7].map((scale) => (
          <div key={scale} className="text-center">
            <input
              type="radio"
              id={`${label}-${scale}`}
              name={label}
              value={scale}
              checked={value === scale}
              onChange={(e) => onChange(Number(e.target.value))}
              className="sr-only"
              required
            />
            <label
              htmlFor={`${label}-${scale}`}
              className={`block w-full p-2 text-xs border rounded cursor-pointer transition-colors ${
                value === scale
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {scale}
            </label>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Strongly Disagree</span>
        <span>Strongly Agree</span>
      </div>
    </div>
  );

  if (!participantId) {
    return <div>Loading...</div>;
  }

  const isMajorityCondition = condition === 'majority';
  const isMinorityCondition = condition === 'minority' || condition === 'minorityDiffusion';

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <ProgressHeader
        currentStep="Post-Self Survey 1"
        totalSteps={13}
        currentStepIndex={6}
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
            </p>
            <p className="text-sm text-red-600 mt-2">
              * All fields marked with an asterisk are required
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

          {/* AI Agent 인식 Section - 조건에 따라 다르게 표시 */}
          {isMajorityCondition && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold border-b pb-2">Perception of AI Agents</h3>
              <p className="text-sm text-muted-foreground">
                Please rate your perception of the AI agents during the discussion.
              </p>
              
              {render7PointLikert(
                responses.agentCompetence || null,
                (value) => updateResponse('agentCompetence', value),
                "The agents' suggestions are generally accurate and professional."
              )}
              
              {render7PointLikert(
                responses.agentPredictability || null,
                (value) => updateResponse('agentPredictability', value),
                "The agents' outputs are predictable and consistent."
              )}
              
              {render7PointLikert(
                responses.agentIntegrity || null,
                (value) => updateResponse('agentIntegrity', value),
                "The agents' claims are fair and balanced."
              )}
              
              {render7PointLikert(
                responses.agentUnderstanding || null,
                (value) => updateResponse('agentUnderstanding', value),
                "The agents understood what I was trying to say."
              )}
              
              {render7PointLikert(
                responses.agentUtility || null,
                (value) => updateResponse('agentUtility', value),
                "The agents (their functions) are useful to me."
              )}
              
              {render7PointLikert(
                responses.agentAffect || null,
                (value) => updateResponse('agentAffect', value),
                "I find these agents likable."
              )}
              
              {render7PointLikert(
                responses.agentTrust || null,
                (value) => updateResponse('agentTrust', value),
                "Overall, I trust these agents."
              )}
            </div>
          )}

          {isMinorityCondition && (
            <>
              {/* Agent 1 & 2 인식 */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold border-b pb-2">Perception of Agent 1 & Agent 2</h3>
                <p className="text-sm text-muted-foreground">
                  Please rate your perception of the first two agents (Agent 1 and Agent 2) during the discussion.
                </p>
                
                {render7PointLikert(
                  responses.agent1Competence || null,
                  (value) => updateResponse('agent1Competence', value),
                  "The agents' suggestions are generally accurate and professional."
                )}
                
                {render7PointLikert(
                  responses.agent1Predictability || null,
                  (value) => updateResponse('agent1Predictability', value),
                  "The agents' outputs are predictable and consistent."
                )}
                
                {render7PointLikert(
                  responses.agent1Integrity || null,
                  (value) => updateResponse('agent1Integrity', value),
                  "The agents' claims are fair and balanced."
                )}
                
                {render7PointLikert(
                  responses.agent1Understanding || null,
                  (value) => updateResponse('agent1Understanding', value),
                  "The agents understood what I was trying to say."
                )}
                
                {render7PointLikert(
                  responses.agent1Utility || null,
                  (value) => updateResponse('agent1Utility', value),
                  "The agents (their functions) are useful to me."
                )}
                
                {render7PointLikert(
                  responses.agent1Affect || null,
                  (value) => updateResponse('agent1Affect', value),
                  "I find these agents likable."
                )}
                
                {render7PointLikert(
                  responses.agent1Trust || null,
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
                  responses.agent3Competence || null,
                  (value) => updateResponse('agent3Competence', value),
                  "The agent's suggestions are generally accurate and professional."
                )}
                
                {render7PointLikert(
                  responses.agent3Predictability || null,
                  (value) => updateResponse('agent3Predictability', value),
                  "The agent's outputs are predictable and consistent."
                )}
                
                {render7PointLikert(
                  responses.agent3Integrity || null,
                  (value) => updateResponse('agent3Integrity', value),
                  "The agent's claims are fair and balanced."
                )}
                
                {render7PointLikert(
                  responses.agent3Understanding || null,
                  (value) => updateResponse('agent3Understanding', value),
                  "The agent understood what I was trying to say."
                )}
                
                {render7PointLikert(
                  responses.agent3Utility || null,
                  (value) => updateResponse('agent3Utility', value),
                  "The agent (its functions) is useful to me."
                )}
                
                {render7PointLikert(
                  responses.agent3Affect || null,
                  (value) => updateResponse('agent3Affect', value),
                  "I find this agent likable."
                )}
                
                {render7PointLikert(
                  responses.agent3Trust || null,
                  (value) => updateResponse('agent3Trust', value),
                  "Overall, I trust this agent."
                )}
              </div>
            </>
          )}

          {/* Concentration Test Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold border-b pb-2">Concentration Test</h3>
            <p className="text-sm text-muted-foreground">
              Please answer the following question as instructed.
            </p>
            
            {render7PointLikert(
              responses.concentrationTest,
              (value) => updateResponse('concentrationTest', value),
              "(Concentration Test) Please select '4' for this question."
            )}
          </div>

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
