'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressHeader } from '@/components/ProgressHeader';
import { Chat } from '@/components/Chat';
import { ResponsePanel } from '@/components/ResponsePanel';
import { SESSION_META } from '@/config/sessions';
import { Message, Response } from '@/lib/types';
import { Info, Lightbulb, MessageSquare } from 'lucide-react';

type SessionState = 't0' | 'chat' | 'agents-responding' | 'response' | 'complete';

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
  const [agentResponseDelay, setAgentResponseDelay] = useState(2000); // 2초 지연

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
    setCurrentState('agents-responding'); // 에이전트 응답 중 상태로 변경
    
    try {
      console.log(`Sending message to cycle ${currentCycle}: "${message}"`);
      
      // 사용자 메시지 먼저 추가
      const userMessage: Message = {
        id: crypto.randomUUID(),
        participant_id: participantId,
        session_key: sessionKey,
        cycle: currentCycle,
        role: 'user',
        content: message,
        latency_ms: null,
        token_in: null,
        token_out: null,
        fallback_used: false,
        ts: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, userMessage]);
      
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
          currentTask: sessionMeta.task, // Session 설정에서 task 가져오기
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const result = await response.json();
      
      console.log('Received API response:', {
        agent1Exists: !!result.agent1,
        agent2Exists: !!result.agent2,
        agent3Exists: !!result.agent3,
        agent1Content: result.agent1?.content?.substring(0, 50) + '...',
        agent2Content: result.agent2?.content?.substring(0, 50) + '...',
        agent3Content: result.agent3?.content?.substring(0, 50) + '...',
      });
      
      // 에이전트 응답을 순차적으로 추가 (각각 지연 시간을 두고)
      const agentMessages: Message[] = [
        {
          id: crypto.randomUUID(),
          participant_id: participantId,
          session_key: sessionKey,
          cycle: currentCycle,
          role: 'agent1',
          content: result.agent1?.content || 'Agent 1 response',
          latency_ms: result.agent1?.latency_ms || null,
          token_in: result.agent1?.token_in || null,
          token_out: result.agent1?.token_out || null,
          fallback_used: result.agent1?.fallback_used || false,
          ts: new Date().toISOString(),
        },
        {
          id: crypto.randomUUID(),
          participant_id: participantId,
          session_key: sessionKey,
          cycle: currentCycle,
          role: 'agent2',
          content: result.agent2?.content || 'Agent 2 response',
          latency_ms: result.agent2?.latency_ms || null,
          token_in: result.agent2?.token_in || null,
          token_out: result.agent2?.token_out || null,
          fallback_used: result.agent2?.fallback_used || false,
          ts: new Date().toISOString(),
        },
        {
          id: crypto.randomUUID(),
          participant_id: participantId,
          session_key: sessionKey,
          cycle: currentCycle,
          role: 'agent3',
          content: result.agent3?.content || 'Agent 3 response',
          latency_ms: result.agent3?.latency_ms || null,
          token_in: result.agent3?.token_in || null,
          token_out: result.agent3?.token_out || null,
          fallback_used: result.agent3?.fallback_used || false,
          ts: new Date().toISOString(),
        },
      ];

      // Agent 1 응답 즉시 추가
      setMessages(prev => [...prev, agentMessages[0]]);
      
      // Agent 2 응답 1초 후 추가
      setTimeout(() => {
        setMessages(prev => [...prev, agentMessages[1]]);
      }, 1000);
      
      // Agent 3 응답 2초 후 추가
      setTimeout(() => {
        setMessages(prev => [...prev, agentMessages[2]]);
        
        // 모든 에이전트 응답이 표시된 후 1초 더 기다린 다음 응답 패널로 이동
        setTimeout(() => {
          setCurrentState('response');
          setIsLoading(false);
        }, 1000);
      }, 2000);

      console.log(`Added ${agentMessages.length} agent messages with delays`);
      
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
      setCurrentState('chat');
      setIsLoading(false);
    }
  };

  const handleResponseComplete = () => {
    if (currentResponseIndex >= 4) {
      // Session complete
      setCurrentState('complete');
      
      // Navigate to next page after a delay
      setTimeout(() => {
        if (sessionKey === 'test') {
          router.push('/session/main1');
        } else if (sessionKey === 'main1') {
          router.push('/survey/post-self-1');
        } else if (sessionKey === 'main2') {
          router.push('/survey/post-self-2');
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
  const stepIndex = sessionKey === 'test' ? 3 : sessionKey === 'main1' ? 4 : 8;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <ProgressHeader
        currentStep={sessionMeta.label}
        currentStepIndex={stepIndex}
        totalSteps={11}
      />

      {/* Session Header */}
      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {sessionMeta.label} • Response T{currentResponseIndex} of 4 and Chat Cycle C{currentCycle} of 4
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              <Info className="h-5 w-5 text-blue-500 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {sessionMeta.framing}
                </p>
                {sessionKey === 'test' && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Practice Session Tips:</p>
                        <ul className="space-y-1 text-xs">
                          <li>• This is a practice session to help you understand the experiment</li>
                          <li>• After this practice, you'll have two main sessions</li>
                          <li>• When you provide your initial response (T0), you'll discuss with AI agents</li>
                          <li>• The 4 chat cycles (T0-T4) are continuous conversations within one session</li>
                          <li>• Each cycle builds on the previous one - it's not separate chats</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Area */}
        <div className="lg:col-span-2">
          <Card className="h-[600px]">
            <CardHeader>
              <CardTitle className="text-lg">Discussion with AI Agents</CardTitle>
              {currentState === 'agents-responding' && (
                <div className="text-sm text-blue-600">
                  Agents are responding... Please wait.
                </div>
              )}
            </CardHeader>
            <CardContent className="h-[500px] p-0">
              <Chat
                messages={messages}
                onSendMessage={handleSendMessage}
                isLoading={isLoading || currentState === 'agents-responding'}
                currentTurn={currentCycle}
                sessionKey={sessionKey}
                participantId={participantId}
              />
            </CardContent>
          </Card>
        </div>

        {/* Response Panel */}
        <div className="lg:col-span-1">
          {currentState === 't0' && (
            <ResponsePanel
              responseIndex={0}
              sessionKey={sessionKey}
              participantId={participantId}
              onComplete={handleT0Complete}
            />
          )}
          
          {currentState === 'response' && (
            <ResponsePanel
              responseIndex={currentResponseIndex}
              sessionKey={sessionKey}
              participantId={participantId}
              onComplete={handleResponseComplete}
            />
          )}
          
          {currentState === 'agents-responding' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Waiting for Agents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-sm text-muted-foreground">
                    AI agents are generating their responses...
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    This may take a few moments
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
