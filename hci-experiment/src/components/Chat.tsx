'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2, MessageCircle } from 'lucide-react';
import { AGENTS, getAgentColor } from '@/config/agents';
import { Message } from '@/lib/types';
import { getPatternDescription, CURRENT_PATTERN } from '@/config/patterns';

interface ChatProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  currentTurn: number;
  sessionKey: string;
  participantId: string;
}

export function Chat({ messages, onSendMessage, isLoading, currentTurn, sessionKey, participantId }: ChatProps) {
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim() && !isLoading) {
      onSendMessage(inputMessage.trim());
      setInputMessage('');
    }
  };

  const currentTurnMessages = messages.filter(m => m.cycle === currentTurn);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {currentTurnMessages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <div className="mb-4">
              <MessageCircle className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="font-medium">Start the conversation</p>
            </div>
            <p className="text-sm">Send a message to begin chatting with the AI agents.</p>
            {currentTurn >= 2 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Tip:</strong> This is an ongoing conversation. Continue naturally from previous exchanges.
                </p>
              </div>
            )}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Current Pattern:</strong> {getPatternDescription(CURRENT_PATTERN, currentTurn)}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* User message */}
            {currentTurnMessages.filter(m => m.role === 'user').map((message) => (
              <div key={message.id} className="flex justify-end">
                <Card className="max-w-[80%] bg-blue-100 border-blue-200">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">You</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(message.ts).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm">{message.content}</p>
                  </CardContent>
                </Card>
              </div>
            ))}

            {/* Agent messages */}
            {AGENTS.map((agent) => {
              const agentMessage = currentTurnMessages.find(m => m.role === `agent${agent.id}`);
              if (!agentMessage) return null;

              return (
                <div key={agentMessage.id} className="flex justify-start">
                  <Card className="max-w-[80%]" style={{ borderLeft: `4px solid ${getAgentColor(agent.id)}` }}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: getAgentColor(agent.id) }}
                          />
                          <span className="text-sm font-medium">{agent.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {agentMessage.fallback_used && (
                            <span className="text-xs text-red-500">Fallback</span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {agentMessage.latency_ms ? `${agentMessage.latency_ms}ms` : ''}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(agentMessage.ts).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm">{agentMessage.content}</p>
                    </CardContent>
                  </Card>
                </div>
              );
            })}

            {/* Loading state */}
            {isLoading && (
              <div className="flex justify-start">
                <Card className="max-w-[80%] bg-gray-100 border-gray-200">
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Agents are generating responses...</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Pattern info for ongoing conversations */}
            {currentTurn >= 2 && currentTurnMessages.length > 0 && !isLoading && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Continue the conversation:</strong> Build on the previous exchanges naturally.
                </p>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={currentTurn >= 2 ? "Continue the conversation..." : "Type your message..."}
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
