import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Play, TestTube, Target, Info } from 'lucide-react';

interface SessionBannerProps {
  sessionKey: 'test' | 'normative' | 'informative';
  isFirstMainSession?: boolean;
}

export function SessionBanner({ sessionKey, isFirstMainSession = false }: SessionBannerProps) {
  const getSessionInfo = () => {
    switch (sessionKey) {
      case 'test':
        return {
          icon: TestTube,
          title: '🧪 테스트 세션 (튜토리얼)',
          description: '이것은 실험 인터페이스를 익히기 위한 연습 세션입니다.',
          color: 'bg-blue-50 border-blue-200 text-blue-800',
          iconColor: 'text-blue-600',
          tips: [
            '실제 실험이 아닌 연습 세션입니다',
            '인터페이스 사용법을 익혀주세요',
            'AI 에이전트와의 대화를 연습해보세요'
          ]
        };
      case 'normative':
      case 'informative':
        return {
          icon: Target,
          title: isFirstMainSession ? '🎯 본 실험 시작!' : '🎯 본 실험 계속',
          description: isFirstMainSession 
            ? '이제부터 실제 실험이 시작됩니다. 진지하게 참여해주세요.'
            : '두 번째 본 실험 세션입니다.',
          color: 'bg-green-50 border-green-200 text-green-800',
          iconColor: 'text-green-600',
          tips: [
            '이제 실제 실험입니다',
            '진지하고 솔직하게 응답해주세요',
            'AI 에이전트와의 대화에 집중해주세요'
          ]
        };
      default:
        return {
          icon: Info,
          title: '정보',
          description: '세션 정보를 확인해주세요.',
          color: 'bg-gray-50 border-gray-200 text-gray-800',
          iconColor: 'text-gray-600',
          tips: []
        };
    }
  };

  const sessionInfo = getSessionInfo();
  const IconComponent = sessionInfo.icon;

  return (
    <Card className={`mb-6 border-2 ${sessionInfo.color}`}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <IconComponent className={`h-6 w-6 ${sessionInfo.iconColor} mt-1 flex-shrink-0`} />
          <div className="flex-1">
            <h3 className="text-lg font-bold mb-2">{sessionInfo.title}</h3>
            <p className="text-sm mb-4">{sessionInfo.description}</p>
            
            {sessionInfo.tips.length > 0 && (
              <div className="bg-white/50 p-3 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  중요 안내사항
                </h4>
                <ul className="text-sm space-y-1">
                  {sessionInfo.tips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-xs mt-1">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
