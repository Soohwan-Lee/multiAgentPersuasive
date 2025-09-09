'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProgressHeader } from '@/components/ProgressHeader';
import { MessageSquare, Users, Clock, Shield, SkipForward, FileCheck } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export default function IntroductionPage() {
  const router = useRouter();
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [consentChecked, setConsentChecked] = useState(false);
  const [isTestMode, setIsTestMode] = useState(false);

  useEffect(() => {
    const storedParticipantId = sessionStorage.getItem('participantId');
    if (!storedParticipantId) {
      router.push('/entry');
      return;
    }
    setParticipantId(storedParticipantId);
    setIsTestMode(sessionStorage.getItem('isTestMode') === 'true');
  }, [router]);

  const handleStart = () => {
    if (!consentChecked) return;
    router.push('/survey/background');
  };

  const handleSkip = () => {
    router.push('/survey/background');
  };

  if (!participantId) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <ProgressHeader
        currentStep="Introduction"
        totalSteps={13}
        currentStepIndex={1}
      />

      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            Welcome to the Multi‑Agent Chat Experiment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Consent Section */}
          <div className="border rounded-lg p-4 bg-white">
            <div className="flex items-start space-x-3 mb-2">
              <FileCheck className="h-6 w-6 text-purple-600 mt-1" />
              <div>
                <h3 className="font-semibold">Consent to Participate</h3>
                <p className="text-sm text-muted-foreground">Please read the information below and agree to continue.</p>
              </div>
            </div>

            <div className="text-sm space-y-3 text-muted-foreground">
              <div>
                <p className="font-medium text-foreground mb-1">Overview</p>
                <p>This study explores decision-making in an online setting by briefly chatting with multiple AI assistants.</p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Procedure</p>
                <p>You will answer a short survey, chat with 3 AI assistants for a few rounds, and answer a few follow-up questions. Total time is about 20–30 minutes.</p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Risks & Discomfort</p>
                <p>You may sometimes be in a majority or minority situation. There is no physical risk.</p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Privacy & Data</p>
                <p>All responses and chats are anonymized and used only for research purposes.</p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Compensation & Withdrawal</p>
                <p>Compensation is provided only if you complete the study. You may stop at any time if you feel uncomfortable, but partial participation is not compensated.</p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Voluntary Participation</p>
                <p>Your participation is voluntary and you may withdraw at any time.</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 mt-4">
              <Checkbox id="consent" checked={consentChecked} onCheckedChange={(v) => setConsentChecked(Boolean(v))} />
              <Label htmlFor="consent" className="text-sm">I have read and agree to participate.</Label>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <MessageSquare className="h-6 w-6 text-blue-600 mt-1" />
                <div>
                  <h3 className="font-semibold">Experiment Overview</h3>
                  <p className="text-sm text-muted-foreground">
                    In this study, you will briefly chat with multiple AI assistants that may hold different perspectives and complete short questionnaires.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Users className="h-6 w-6 text-green-600 mt-1" />
                <div>
                  <h3 className="font-semibold">How It Works</h3>
                  <p className="text-sm text-muted-foreground">
                    There are 3 sessions with 4 cycles each. In each cycle, you send a short message and three AI assistants reply.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Clock className="h-6 w-6 text-orange-600 mt-1" />
                <div>
                  <h3 className="font-semibold">Duration</h3>
                  <p className="text-sm text-muted-foreground">
                    The entire experiment takes approximately 20-30 minutes. 
                    Each cycle has time limits, so please respond carefully.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Shield className="h-6 w-6 text-purple-600 mt-1" />
                <div>
                  <h3 className="font-semibold">Privacy Protection</h3>
                  <p className="text-sm text-muted-foreground">
                    All responses are processed anonymously and used only for research purposes. 
                    You can stop the experiment at any time.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">⚠️ Important Notes</h3>
            <ul className="text-sm space-y-1">
              <li>
                <span className="font-semibold text-red-700">
                  🚫 Decide on your own. Do NOT use internet search or other AIs (LLMs) during the study.
                </span>
              </li>
              <li>• Do not close the browser, refresh, or use the back button during the experiment</li>
              <li>• Please respond within the time limit for each cycle</li>
              <li>• Have honest and natural conversations</li>
              <li>• Contact the experimenter if any problems occur</li>
            </ul>
          </div>

          <div className="text-center pt-4 space-y-3">
            <Button onClick={handleStart} size="lg" disabled={!consentChecked}>
              Start Experiment
            </Button>
            {!consentChecked && (
              <p className="text-xs text-muted-foreground">Please check “I agree” above to continue.</p>
            )}
            
            {/* TEST MODE SKIP BUTTON */}
            {isTestMode && (
              <div className="border-t pt-4 hidden">
                <Button 
                  onClick={handleSkip}
                  variant="outline"
                  disabled
                  className="text-orange-600 border-orange-300 hover:bg-orange-50"
                >
                  <SkipForward className="h-4 w-4 mr-2" />
                  Skip to Background Survey (Test Mode)
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
