import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2, Clock, MessageSquare } from 'lucide-react';
import { Message } from '@/lib/types';
import { useState } from 'react';

interface ChatProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  currentTurn: number;
  sessionKey: string;
}

export function Chat({ messages, onSendMessage, isLoading, currentTurn, sessionKey }: ChatProps) {
  const [inputMessage, setInputMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim() && !isLoading) {
      onSendMessage(inputMessage.trim());
      setInputMessage('');
    }
  };

  const getAgentName = (role: string) => {
    switch (role) {
      case 'agent1': return '에이전트 1 (다수)';
      case 'agent2': return '에이전트 2 (소수)';
      case 'agent3': return '에이전트 3 (중립)';
      default: return role;
    }
  };

  const getAgentColor = (role: string) => {
    switch (role) {
      case 'user': return 'bg-blue-100 border-blue-200';
      case 'agent1': return 'bg-green-100 border-green-200';
      case 'agent2': return 'bg-purple-100 border-purple-200';
      case 'agent3': return 'bg-orange-100 border-orange-200';
      default: return 'bg-gray-100 border-gray-200';
    }
  };

  const currentTurnMessages = messages.filter(m => m.t_idx === currentTurn);

  return (
    <div className="flex flex-col h-full">
      {/* 채팅 영역 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {currentTurnMessages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>메시지를 입력하여 대화를 시작하세요.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 사용자 메시지 */}
            {currentTurnMessages.filter(m => m.role === 'user').map((message) => (
              <div key={message.id} className="flex justify-end">
                <Card className={`max-w-[80%] ${getAgentColor(message.role)}`}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">나</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(message.ts).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm">{message.content}</p>
                  </CardContent>
                </Card>
              </div>
            ))}

            {/* 에이전트 메시지들 */}
            {currentTurnMessages.filter(m => m.role.startsWith('agent')).map((message) => (
              <div key={message.id} className="flex justify-start">
                <Card className={`max-w-[80%] ${getAgentColor(message.role)}`}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{getAgentName(message.role)}</span>
                      <div className="flex items-center space-x-2">
                        {message.fallback_used && (
                          <span className="text-xs text-red-500">폴백</span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {message.latency_ms ? `${message.latency_ms}ms` : ''}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(message.ts).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm">{message.content}</p>
                  </CardContent>
                </Card>
              </div>
            ))}

            {/* 로딩 상태 */}
            {isLoading && (
              <div className="flex justify-start">
                <Card className="max-w-[80%] bg-gray-100 border-gray-200">
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">에이전트들이 응답을 생성하고 있습니다...</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 입력 영역 */}
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="메시지를 입력하세요..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !inputMessage.trim()}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
