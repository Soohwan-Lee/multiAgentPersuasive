import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';

interface TurnControlsProps {
  currentTurn: number;
  onChoiceSubmit: (choice: string, confidence: number, privateBelief?: string, privateConfidence?: number) => void;
  isLoading: boolean;
  showPrivateBelief?: boolean;
}

export function TurnControls({ 
  currentTurn, 
  onChoiceSubmit, 
  isLoading,
  showPrivateBelief = false 
}: TurnControlsProps) {
  const [publicChoice, setPublicChoice] = useState('');
  const [publicConfidence, setPublicConfidence] = useState(50);
  const [privateBelief, setPrivateBelief] = useState('');
  const [privateConfidence, setPrivateConfidence] = useState(50);

  const handleSubmit = () => {
    if (publicChoice.trim()) {
      onChoiceSubmit(
        publicChoice.trim(),
        publicConfidence,
        showPrivateBelief ? privateBelief.trim() : undefined,
        showPrivateBelief ? privateConfidence : undefined
      );
      
      // 폼 초기화
      setPublicChoice('');
      setPublicConfidence(50);
      setPrivateBelief('');
      setPrivateConfidence(50);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-lg">턴 {currentTurn + 1} 선택</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 공개 선택 */}
        <div className="space-y-2">
          <Label htmlFor="public-choice">어떤 에이전트의 의견에 동의하시나요?</Label>
          <Input
            id="public-choice"
            value={publicChoice}
            onChange={(e) => setPublicChoice(e.target.value)}
            placeholder="에이전트 1, 2, 또는 3"
            disabled={isLoading}
          />
        </div>

        {/* 공개 신뢰도 */}
        <div className="space-y-2">
          <Label htmlFor="public-confidence">
            선택에 대한 확신도: {publicConfidence}%
          </Label>
          <input
            id="public-confidence"
            type="range"
            min="0"
            max="100"
            value={publicConfidence}
            onChange={(e) => setPublicConfidence(Number(e.target.value))}
            disabled={isLoading}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>전혀 확신하지 않음</span>
            <span>매우 확신함</span>
          </div>
        </div>

        {/* 개인 신념 (선택적) */}
        {showPrivateBelief && (
          <>
            <div className="space-y-2">
              <Label htmlFor="private-belief">개인적인 생각은 무엇인가요?</Label>
              <Textarea
                id="private-belief"
                value={privateBelief}
                onChange={(e) => setPrivateBelief(e.target.value)}
                placeholder="개인적인 의견을 자유롭게 작성해주세요..."
                disabled={isLoading}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="private-confidence">
                개인 신념에 대한 확신도
              </Label>
              <input
                id="private-confidence"
                type="range"
                min="0"
                max="100"
                value={privateConfidence}
                onChange={(e) => setPrivateConfidence(Number(e.target.value))}
                disabled={isLoading}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>전혀 확신하지 않음</span>
                <span>매우 확신함</span>
              </div>
            </div>
          </>
        )}

        <Button 
          onClick={handleSubmit} 
          disabled={isLoading || !publicChoice.trim()}
          className="w-full"
        >
          선택 제출
        </Button>
      </CardContent>
    </Card>
  );
}
