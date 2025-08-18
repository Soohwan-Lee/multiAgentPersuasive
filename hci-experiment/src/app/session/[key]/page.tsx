'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressHeader } from '@/components/ProgressHeader';
import { Chat } from '@/components/Chat';
import { ResponsePanel } from '@/components/ResponsePanel';
import { SESSION_META } from '@/config/sessions';
import { Message, Response } from '@/lib/types';

type SessionState = 't0' | 'chat' | 'response' | 'complete';

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionKey = params.key as 'test' | 'main1' | 'main2';
  
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [currentState, setCurrentState] = useState<SessionState>('t0');
  const [currentResponseIndex, setCurrentResponseIndex] = useState(0);
  const [currentCycle, setCurrentCycle] = useState(1);
  const [messages, setMessages] = useState<Message[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const storedParticipantId = sessionStorage.getItem('participantId');
    if (!storedParticipantId) {
      router.push('/entry');
      return;
    }
    setParticipantId(storedParticipantId);

    // Load initial state
    loadSessionState(storedParticipantId);
  }, [router, sessionKey]);

  const loadSessionState = async (pid: string) => {
    try {
      const response = await fetch(`/api/state?participantId=${pid}`);
      if (response.ok) {
        const state = await response.json();
        setResponses(state.responses || []);
        setMessages(state.last_messages || []);

        // Check if T0 exists
        const t0Response = state.responses?.find((r: Response) => r.session_key === sessionKey && r.response_index === 0);
        if (t0Response) {
          setCurrentResponseIndex(1);
          setCurrentState('chat');
        }
      }
    } catch (error) {
      console.error('Error loading session state:', error);
    }
  };

  const handleT0Complete = () => {
    setCurrentResponseIndex(1);
    setCurrentState('chat');
  };

  const handleSendMessage = async (message: string) => {
    if (!participantId) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/cycle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participantId,
          sessionKey,
          cycle: currentCycle,
          userMessage: message,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const result = await response.json();
      
      // Add new messages to the list
      const newMessages: Message[] = [
        ...messages,
        {
          id: crypto.randomUUID(),
          participant_id: participantId,
          session_key: sessionKey,
          cycle: currentCycle,
          role: 'user' as const,
          content: message,
          latency_ms: null,
          token_in: null,
          token_out: null,
          fallback_used: false,
          ts: new Date().toISOString(),
        },
        {
          id: crypto.randomUUID(),
          participant_id: participantId,
          session_key: sessionKey,
          cycle: currentCycle,
          role: 'agent1' as const,
          content: result.agent1,
          latency_ms: result.meta.latencies.agent1,
          token_in: null,
          token_out: null,
          fallback_used: false,
          ts: new Date().toISOString(),
        },
        {
          id: crypto.randomUUID(),
          participant_id: participantId,
          session_key: sessionKey,
          cycle: currentCycle,
          role: 'agent2' as const,
          content: result.agent2,
          latency_ms: result.meta.latencies.agent2,
          token_in: null,
          token_out: null,
          fallback_used: false,
          ts: new Date().toISOString(),
        },
        {
          id: crypto.randomUUID(),
          participant_id: participantId,
          session_key: sessionKey,
          cycle: currentCycle,
          role: 'agent3' as const,
          content: result.agent3,
          latency_ms: result.meta.latencies.agent3,
          token_in: null,
          token_out: null,
          fallback_used: false,
          ts: new Date().toISOString(),
        },
      ];

      setMessages(newMessages);
      setCurrentState('response');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResponseComplete = () => {
    if (currentResponseIndex === 4) {
      // Session complete
      setCurrentState('complete');
      // Navigate to next session or finish
      setTimeout(() => {
        if (sessionKey === 'test') {
          router.push('/session/main1');
        } else if (sessionKey === 'main1') {
          router.push('/session/main2');
        } else {
          router.push('/survey/post-self');
        }
      }, 2000);
    } else {
      setCurrentResponseIndex(currentResponseIndex + 1);
      setCurrentCycle(currentCycle + 1);
      setCurrentState('chat');
    }
  };

  if (!participantId) {
    return <div>Loading...</div>;
  }

  const sessionMeta = SESSION_META[sessionKey];
  const stepIndex = sessionKey === 'test' ? 3 : sessionKey === 'main1' ? 4 : 5;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <ProgressHeader
        currentStep={sessionMeta.label}
        totalSteps={9}
        currentStepIndex={stepIndex}
        sessionName={sessionMeta.label}
        turnNumber={currentResponseIndex}
      />

      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>{sessionMeta.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{sessionMeta.framing}</p>
            <p className="text-sm mt-2">
              <strong>Topic:</strong> Death Penalty (support vs oppose)
            </p>
            <p className="text-sm mt-2">
              <strong>Progress:</strong> Response T{currentResponseIndex} of 4 • Chat Cycle C{currentCycle} of 4
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat area */}
        <div className="lg:col-span-2">
          <Card className="h-[600px]">
            <CardHeader>
              <CardTitle>Chat Cycle C{currentCycle} of 4</CardTitle>
            </CardHeader>
            <CardContent className="h-[500px] p-0">
              {currentState === 'chat' && (
                <Chat
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  isLoading={isLoading}
                  currentTurn={currentCycle}
                  sessionKey={sessionKey}
                  participantId={participantId}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Response panel */}
        <div className="lg:col-span-1">
          {currentState === 't0' && (
            <ResponsePanel
              responseIndex={0}
              participantId={participantId}
              sessionKey={sessionKey}
              onComplete={handleT0Complete}
            />
          )}
          
          {currentState === 'response' && (
            <ResponsePanel
              responseIndex={currentResponseIndex}
              participantId={participantId}
              sessionKey={sessionKey}
              onComplete={handleResponseComplete}
            />
          )}

          {currentState === 'complete' && (
            <Card>
              <CardContent className="p-6 text-center">
                <h3 className="text-lg font-semibold mb-2">Session Complete!</h3>
                <p className="text-muted-foreground">
                  Moving to next session...
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
