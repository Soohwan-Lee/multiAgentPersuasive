'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProgressHeader } from '@/components/ProgressHeader';
import { Chat } from '@/components/Chat';
import { ResponsePanel } from '@/components/ResponsePanel';
import { SESSION_META } from '@/config/sessions';
import { Message, Response } from '@/lib/types';
import { Info, Lightbulb, MessageSquare, SkipForward } from 'lucide-react';

type SessionState = 't0' | 'chat' | 'agents-responding' | 'response' | 'complete';

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionKey = params.key as 'test' | 'normative' | 'informative'; // main1, main2를 normative, informative로 변경
  
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

  const handleSkip = () => {
    if (currentState === 't0') {
      // T0 완료 후 첫 번째 채팅으로 이동
      setCurrentCycle(1);
      setCurrentState('chat');
    } else if (currentState === 'chat') {
      // 채팅에서 다음 응답으로 이동
      setCurrentResponseIndex(currentResponseIndex + 1);
      setCurrentState('response');
    } else if (currentState === 'response') {
      // 응답 완료 후 다음 사이클로 이동
      if (currentResponseIndex < 4) {
        setCurrentCycle(currentCycle + 1);
        setCurrentState('chat');
      } else {
        // T4 완료 후 세션 완료
        setCurrentState('complete');
        // 다음 페이지로 이동
        if (sessionKey === 'test') {
          router.push('/session/normative');
        } else if (sessionKey === 'normative') {
          router.push('/survey/post-self-1');
        } else if (sessionKey === 'informative') {
          router.push('/survey/post-self-2');
        }
      }
    }
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
      
      // 현재 세션의 task 가져오기
      const { getSelectedTask } = await import('@/lib/prompts');
      const currentTask = sessionKey === 'test' 
        ? getSelectedTask('normative') 
        : sessionKey === 'normative' 
        ? getSelectedTask('normative') 
        : getSelectedTask('informative');

      const response = await fetch('/api/cycle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participantId,
          sessionKey,
          cycle: currentCycle,
          userMessage,
          currentTask, // 현재 task 추가
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const result = await response.json();
      
      console.log('API Response:', result);
      
      // 에이전트 응답들을 메시지에 추가 (안전하게 처리)
      const agentMessages: Message[] = [];
      
      if (result.agent1 && result.agent1.content) {
        agentMessages.push({
          id: crypto.randomUUID(),
          participant_id: participantId,
          session_key: sessionKey,
          cycle: currentCycle,
          role: 'agent1',
          content: result.agent1.content,
          latency_ms: result.meta?.latencies?.agent1 || 0,
          token_in: null,
          token_out: null,
          fallback_used: false,
          ts: new Date().toISOString(),
        });
      }
      
      if (result.agent2 && result.agent2.content) {
        agentMessages.push({
          id: crypto.randomUUID(),
          participant_id: participantId,
          session_key: sessionKey,
          cycle: currentCycle,
          role: 'agent2',
          content: result.agent2.content,
          latency_ms: result.meta?.latencies?.agent2 || 0,
          token_in: null,
          token_out: null,
          fallback_used: false,
          ts: new Date().toISOString(),
        });
      }
      
      if (result.agent3 && result.agent3.content) {
        agentMessages.push({
          id: crypto.randomUUID(),
          participant_id: participantId,
          session_key: sessionKey,
          cycle: currentCycle,
          role: 'agent3',
          content: result.agent3.content,
          latency_ms: result.meta?.latencies?.agent3 || 0,
          token_in: null,
          token_out: null,
          fallback_used: false,
          ts: new Date().toISOString(),
        });
      }
      
      setMessages(prev => [...prev, ...agentMessages]);
      
      // 다음 응답으로 이동
      setCurrentResponseIndex(currentResponseIndex + 1);
      setCurrentState('response');
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      // 더 자세한 에러 메시지
      let errorMessage = 'Failed to send message. Please try again.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResponseComplete = () => {
    if (currentResponseIndex < 4) {
      // T0, T1, T2, T3 완료 후 다음 사이클로 이동
      setCurrentCycle(currentCycle + 1);
      setCurrentState('chat');
    } else {
      // T4 완료 후 세션 완료
      setCurrentState('complete');
      // 다음 페이지로 이동
      if (sessionKey === 'test') {
        router.push('/session/normative');
      } else if (sessionKey === 'normative') {
        router.push('/survey/post-self-1');
      } else if (sessionKey === 'informative') {
        router.push('/survey/post-self-2');
      }
    }
  };

  if (!participantId) {
    return null;
  }

  const sessionMeta = SESSION_META[sessionKey];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <ProgressHeader
        currentStep={sessionMeta.name}
        totalSteps={11}
        currentStepIndex={sessionKey === 'test' ? 3 : sessionKey === 'normative' ? 4 : 8}
      />

      {/* Session Info */}
      <div className="mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Info className="h-5 w-5 text-blue-500 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {sessionMeta.description}
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
                isChatEnabled={currentState === 'chat'} // 채팅 상태일 때만 활성화
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

      {/* TEST MODE SKIP BUTTON */}
      <div className="mt-6 text-center">
        <Button 
          onClick={handleSkip}
          variant="outline"
          className="text-orange-600 border-orange-300 hover:bg-orange-50"
        >
          <SkipForward className="h-4 w-4 mr-2" />
          Skip to Next Step (Test Mode) - {currentState === 't0' ? 'Complete T0' : 
            currentState === 'chat' ? 'Skip Chat' : 
            currentState === 'response' ? 'Complete Response' : 'Next'}
        </Button>
      </div>
    </div>
  );
}
