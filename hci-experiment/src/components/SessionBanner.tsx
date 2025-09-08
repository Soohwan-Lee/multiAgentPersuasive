import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Play, TestTube, Target, Info } from 'lucide-react';

interface SessionBannerProps {
  sessionKey: 'test' | 'normative' | 'informative';
  isFirstMainSession?: boolean;
  currentTask?: string;
}

export function SessionBanner({ sessionKey, isFirstMainSession = false, currentTask }: SessionBannerProps) {
  const getSessionInfo = () => {
    switch (sessionKey) {
      case 'test':
        return {
          icon: TestTube,
          title: '🧪 Practice Session (Tutorial)',
          description: 'Before We Start 🚀 Here’s how the session works. Just follow these simple steps!',
          tips: [
            'Set your stance (T0): Use the sliders to show support/oppose and your confidence.',
            'Say it in one short sentence: e.g., "I support it because ..." / "I oppose it because ..."',
            'Chat with the AI assistants: 4 rounds in total. If your stance or confidence changes, adjust the sliders. 👉 You can change your stance up to 4 times.',
            'Move the sliders each round: You must move each slider at least once per round. ✅ It’s okay to move and then return to your original values.',
            'Match your sliders and your chat: Keep messages consistent with your current sliders. If you switch from support to oppose (or vice versa), update the slider first, then write your message.'
          ]
        };
      case 'normative':
      case 'informative':
        return {
          icon: Target,
          title: isFirstMainSession ? '🎯 Main Experiment Starts!' : '🎯 Main Experiment Continues',
          description: isFirstMainSession 
            ? 'The actual experiment is now starting. Please participate seriously.'
            : 'This is the second main experiment session.',
          tips: [
            'This is now the actual experiment',
            'Please respond seriously and honestly',
            'Focus on your conversations with AI agents'
          ]
        };
      default:
        return {
          icon: Info,
          title: 'Information',
          description: 'Please check the session information.',
          tips: []
        };
    }
  };

  const sessionInfo = getSessionInfo();
  const IconComponent = sessionInfo.icon;

  return (
    <Card className="mb-6 border-2 border-gray-200 bg-gray-50">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <IconComponent className="h-6 w-6 text-gray-600 mt-1 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-lg font-bold mb-2">{sessionInfo.title}</h3>
            <p className="text-sm mb-4">{sessionInfo.description}</p>

            {/* Practice Session: Highly visible Important Note */}
            {sessionKey === 'test' && (
              <div
                className="mb-4 rounded-lg p-4 sm:p-5 border-2 shadow-sm"
                style={{ backgroundColor: '#FFF9C4', borderColor: '#FBC02D' }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-5 w-5 text-yellow-800" />
                  <h4 className="text-base sm:text-lg font-bold text-yellow-900">Important Note</h4>
                </div>
                <p className="text-sm text-yellow-900">
                  Decide on your own. Do NOT use internet search or other AIs (LLMs) during the study.
                </p>
              </div>
            )}
            
            {/* 현재 task 주제 표시 */}
            {currentTask && (
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mb-4">
                <h4 className="font-medium mb-1 text-blue-800 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Current Discussion Topic
                </h4>
                <p className="text-blue-700 font-medium">{currentTask}</p>
              </div>
            )}
            
            {sessionInfo.tips.length > 0 && (
              <div className="bg-white/50 p-3 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Important Notes
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
