'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressHeader } from '@/components/ProgressHeader';
import { Chat } from '@/components/Chat';
import { T0Panel } from '@/components/T0Panel';
import { ResponsePanel } from '@/components/ResponsePanel';
import { SESSION_META } from '@/config/sessions';
import { Message, Turn } from '@/lib/types';

type SessionState = 't0' | 'chat' | 'response' | 'complete';

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionKey = params.key as 'test' | 'main1' | 'main2';
  
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [currentState, setCurrentState] = useState<SessionState>('t0');
  const [currentTurn, setCurrentTurn] = useState(1);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const storedParticipantId = sessionStorage.getItem('participantId');
    if (!storedParticipantId) {
      router.push('/entry');
      return;
    }
    setParticipantId(storedParticipantId);

    // Check if t0 already exists
    checkT0Exists(storedParticipantId);
  }, [router, sessionKey]);

  const checkT0Exists = async (pid: string) => {
    try {
      const response = await fetch(`/api/state?participantId=${pid}`);
      if (response.ok) {
        const state = await response.json();
        const session = state.sessions.find((s: any) => s.key === sessionKey);
        if (session) {
          // Check if t0 exists
          const t0Turn = state.turns?.find((t: any) => t.session_key === sessionKey && t.t_idx === 0);
          if (t0Turn) {
            setCurrentState('chat');
            setCurrentTurn(1);
            loadMessages(pid);
          }
        }
      }
    } catch (error) {
      console.error('Error checking t0:', error);
    }
  };

  const loadMessages = async (pid: string) => {
    try {
      const response = await fetch(`/api/state?participantId=${pid}`);
      if (response.ok) {
        const state = await response.json();
        setMessages(state.last_messages || []);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleT0Complete = () => {
    setCurrentState('chat');
    setCurrentTurn(1);
  };

  const handleSendMessage = async (message: string) => {
    if (!participantId) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/turn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participantId,
          sessionKey,
          turnIndex: currentTurn,
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
          t_idx: currentTurn,
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
          t_idx: currentTurn,
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
          t_idx: currentTurn,
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
          t_idx: currentTurn,
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
    if (currentTurn === 4) {
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
      setCurrentTurn(currentTurn + 1);
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
        turnNumber={currentTurn}
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
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat area */}
        <div className="lg:col-span-2">
          <Card className="h-[600px]">
            <CardHeader>
              <CardTitle>Turn {currentTurn} of 4</CardTitle>
            </CardHeader>
            <CardContent className="h-[500px] p-0">
              {currentState === 'chat' && (
                <Chat
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  isLoading={isLoading}
                  currentTurn={currentTurn}
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
            <T0Panel
              sessionKey={sessionKey}
              participantId={participantId}
              onComplete={handleT0Complete}
            />
          )}
          
          {currentState === 'response' && (
            <ResponsePanel
              turnIndex={currentTurn}
              participantId={participantId}
              sessionKey={sessionKey}
              onComplete={handleResponseComplete}
              showPrivateBelief={currentTurn === 4}
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
