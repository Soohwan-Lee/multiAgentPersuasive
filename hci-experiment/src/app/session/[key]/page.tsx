'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProgressHeader } from '@/components/ProgressHeader';
import { SessionBanner } from '@/components/SessionBanner';
import { Chat } from '@/components/Chat';
import { ResponsePanel } from '@/components/ResponsePanel';
import { SESSION_META } from '@/config/sessions';
import { Message, Response } from '@/lib/types';
import { Info, Lightbulb, MessageSquare, SkipForward } from 'lucide-react';
import { getFirstSession, getSecondSession } from '@/config/session-order';
import { getCurrentSessionTask, getCurrentTaskDisplay } from '@/lib/task-example';

type SessionState = 't0' | 'chat' | 'agents-responding' | 'response' | 'complete';

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionKey = params.key as 'test' | 'normative' | 'informative'; // main1, main2를 normative, informative로 변경
  
  // 디버깅을 위한 로깅
  console.log('SessionPage - params:', params);
  console.log('SessionPage - sessionKey:', sessionKey);
  console.log('SessionPage - available keys:', Object.keys(SESSION_META));
  
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [currentState, setCurrentState] = useState<SessionState>('t0');
  const [currentResponseIndex, setCurrentResponseIndex] = useState(0);
  const [currentCycle, setCurrentCycle] = useState(1);
  const [messages, setMessages] = useState<Message[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [agentResponseDelay, setAgentResponseDelay] = useState(2000); // 2초 지연

  // 현재 task 정보 가져오기
  const currentTask = getCurrentSessionTask(sessionKey);
  const currentTaskDisplay = getCurrentTaskDisplay(sessionKey);

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
    console.log(`Skip clicked. Current state: ${currentState}, Response index: ${currentResponseIndex}, Cycle: ${currentCycle}`);
    
    if (currentState === 't0') {
      // T0 완료 후 첫 번째 채팅으로 이동
      console.log('T0 completed, moving to first chat (cycle 1)');
      setCurrentCycle(1);
      setCurrentState('chat');
    } else if (currentState === 'chat') {
      // 채팅에서 다음 응답으로 이동
      console.log(`Moving from chat to response ${currentResponseIndex + 1}`);
      setCurrentResponseIndex(currentResponseIndex + 1);
      setCurrentState('response');
    } else if (currentState === 'response') {
      // 응답 완료 후 다음 사이클로 이동
      if (currentResponseIndex < 4) {
        const nextCycle = currentCycle + 1;
        console.log(`Response ${currentResponseIndex} completed, moving to next cycle: ${nextCycle}`);
        setCurrentCycle(nextCycle);
        setCurrentState('chat');
      } else {
        // T4 완료 후 세션 완료
        console.log('T4 completed, moving to next page');
        setCurrentState('complete');
        // 다음 페이지로 이동
        if (sessionKey === 'test') {
          router.push('/session-transition');
        } else if (sessionKey === getFirstSession()) {
          router.push('/survey/post-self-1');
        } else if (sessionKey === getSecondSession()) {
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
      const { getCurrentSessionTask } = await import('@/lib/task-example');
      const currentTask = getCurrentSessionTask(sessionKey);

      const response = await fetch('/api/cycle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participantId,
          sessionKey,
          cycle: currentCycle,
          userMessage: message, // 문자열로 전송
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
      
      // 채팅 완료 후 응답 단계로 이동 (응답 인덱스는 증가하지 않음)
      console.log(`Chat in cycle ${currentCycle} completed, moving to response ${currentResponseIndex}`);
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
    console.log(`Response ${currentResponseIndex} completed. Current cycle: ${currentCycle}`);
    
    if (currentResponseIndex < 4) {
      // T0, T1, T2, T3 완료 후 다음 사이클로 이동
      const nextCycle = currentCycle + 1;
      const nextResponseIndex = currentResponseIndex + 1;
      console.log(`Moving to next cycle: ${nextCycle} and response index: ${nextResponseIndex}`);
      setCurrentCycle(nextCycle);
      setCurrentResponseIndex(nextResponseIndex);
      setCurrentState('chat');
    } else {
      // T4 완료 후 세션 완료
      console.log('All responses completed. Moving to next page.');
      setCurrentState('complete');
      // 다음 페이지로 이동
      if (sessionKey === 'test') {
        router.push('/session-transition');
      } else if (sessionKey === getFirstSession()) {
        router.push('/survey/post-self-1');
      } else if (sessionKey === getSecondSession()) {
        router.push('/survey/post-self-2');
      }
    }
  };

  if (!participantId) {
    return null;
  }

  const sessionMeta = SESSION_META[sessionKey as keyof typeof SESSION_META];
  
  // sessionMeta가 undefined인 경우 처리
  if (!sessionMeta) {
    console.error('Invalid session key:', sessionKey);
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid Session</h1>
          <p className="text-gray-600 mb-4">The session you're trying to access is not valid.</p>
          <Button onClick={() => router.push('/entry')}>
            Return to Entry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <ProgressHeader
        currentStep={sessionMeta.name}
        totalSteps={13}
        currentStepIndex={sessionKey === 'test' ? 3 : sessionKey === 'normative' ? 5 : 9}
      />

      {/* Session Banner */}
      <SessionBanner 
        sessionKey={sessionKey} 
        isFirstMainSession={sessionKey === getFirstSession()}
        currentTask={currentTaskDisplay}
      />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Area */}
        <div className="lg:col-span-2">
          <Card className={`h-[600px] ${sessionKey === 'test' && currentState === 'chat' ? 'ring-4 ring-blue-500 ring-opacity-50 bg-blue-50' : ''}`}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                Discussion with AI Agents
                {sessionKey === 'test' && currentState === 'chat' && (
                  <div className="flex items-center gap-1 text-blue-600 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    Current Step
                  </div>
                )}
              </CardTitle>
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
                currentTask={currentTaskDisplay}
              />
            </CardContent>
          </Card>
        </div>

        {/* Response Panel */}
        <div className="lg:col-span-1">
          {currentState === 't0' && (
            <div className={`${sessionKey === 'test' ? 'ring-4 ring-blue-500 ring-opacity-50 bg-blue-50' : ''}`}>
              <ResponsePanel
                responseIndex={0}
                sessionKey={sessionKey}
                participantId={participantId}
                onComplete={handleT0Complete}
              />
              {sessionKey === 'test' && (
                <div className="mt-2 p-2 bg-blue-100 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-700 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="font-medium">Current Step:</span> Complete the initial response
                  </div>
                </div>
              )}
            </div>
          )}
          
          {currentState === 'response' && (
            <div className={`${sessionKey === 'test' ? 'ring-4 ring-blue-500 ring-opacity-50 bg-blue-50' : ''}`}>
              <ResponsePanel
                responseIndex={currentResponseIndex}
                sessionKey={sessionKey}
                participantId={participantId}
                onComplete={handleResponseComplete}
              />
              {sessionKey === 'test' && (
                <div className="mt-2 p-2 bg-blue-100 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-700 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="font-medium">Current Step:</span> Rate the agents' responses
                  </div>
                </div>
              )}
            </div>
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

      {/* Experiment Progress Indicator (Debug Mode - Remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold text-gray-700">실험 진행 상황 (디버그 모드)</h3>
            <p className="text-sm text-gray-600">현재 단계와 다음 단계를 확인하세요</p>
          </div>
          
          <div className="grid grid-cols-5 gap-2 mb-4">
            {['T0', 'Chat1', 'T1', 'Chat2', 'T2', 'Chat3', 'T3', 'Chat4', 'T4'].map((step, index) => {
              let stepStatus = 'pending';
              let stepLabel = step;
              
              if (step.startsWith('T')) {
                const stepIndex = parseInt(step.substring(1));
                if (currentResponseIndex > stepIndex) {
                  stepStatus = 'completed';
                } else if (currentResponseIndex === stepIndex && currentState === 'response') {
                  stepStatus = 'current';
                }
              } else if (step.startsWith('Chat')) {
                const chatNum = parseInt(step.substring(4));
                if (currentCycle > chatNum) {
                  stepStatus = 'completed';
                } else if (currentCycle === chatNum && currentState === 'chat') {
                  stepStatus = 'current';
                }
              }
              
              return (
                <div
                  key={step}
                  className={`p-2 rounded text-xs font-medium text-center ${
                    stepStatus === 'completed' 
                      ? 'bg-green-100 text-green-800 border border-green-200' 
                      : stepStatus === 'current'
                      ? 'bg-blue-100 text-blue-800 border border-blue-200 ring-2 ring-blue-300'
                      : 'bg-gray-100 text-gray-500 border border-gray-200'
                  }`}
                >
                  {stepLabel}
                </div>
              );
            })}
          </div>
          
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-2">
              <span className="font-medium">현재 상태:</span> {currentState} | 
              <span className="font-medium"> 응답 단계:</span> T{currentResponseIndex} | 
              <span className="font-medium"> 채팅 사이클:</span> {currentCycle}
            </div>
            
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
      )}
    </div>
  );
}
