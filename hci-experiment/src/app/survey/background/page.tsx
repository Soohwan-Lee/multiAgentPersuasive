'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// Simple checkbox component
const Checkbox = ({ id, checked, onCheckedChange }: { id: string; checked: boolean; onCheckedChange: (checked: any) => void }) => (
  <input
    type="checkbox"
    id={id}
    checked={checked}
    onChange={(e) => onCheckedChange(e.target.checked)}
    className="h-4 w-4 rounded border border-gray-300 text-blue-600 focus:ring-blue-500"
  />
);
import { Textarea } from '@/components/ui/textarea';
import { ProgressHeader } from '@/components/ProgressHeader';
import { SkipForward } from 'lucide-react';

export default function BackgroundSurveyPage() {
  const router = useRouter();
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  // Basic Demographics
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [education, setEducation] = useState('');
  const [occupation, setOccupation] = useState('');
  const [country, setCountry] = useState('');
  const [languages, setLanguages] = useState<string[]>([]);
  const [englishProficiency, setEnglishProficiency] = useState<number | null>(null);
  const [raceEthnicity, setRaceEthnicity] = useState<string>('');
  const [raceOther, setRaceOther] = useState('');

  // AI / Multi-Agent Experience
  const [llmUsage, setLlmUsage] = useState<number | null>(null);
  const [toolsUsed, setToolsUsed] = useState<string[]>([]);
  const [toolsOther, setToolsOther] = useState('');
  const [multiAgentExperience, setMultiAgentExperience] = useState('');
  const [multiAgentTypes, setMultiAgentTypes] = useState<string[]>([]);
  const [multiAgentOther, setMultiAgentOther] = useState('');
  const [multiAgentOpenEnded, setMultiAgentOpenEnded] = useState('');

  // Individual Difference Measures
  const [sii1, setSii1] = useState<number | null>(null);
  const [sii2, setSii2] = useState<number | null>(null);
  const [sii3, setSii3] = useState<number | null>(null);
  const [sii4, setSii4] = useState<number | null>(null);
  const [nfc1, setNfc1] = useState<number | null>(null);
  const [nfc2, setNfc2] = useState<number | null>(null);
  const [nfc3, setNfc3] = useState<number | null>(null);
  const [nfc4, setNfc4] = useState<number | null>(null);
  const [nfc5, setNfc5] = useState<number | null>(null);
  const [nfc6, setNfc6] = useState<number | null>(null);
  const [aiAcceptance1, setAiAcceptance1] = useState<number | null>(null);
  const [aiAcceptance2, setAiAcceptance2] = useState<number | null>(null);
  const [aiAcceptance3, setAiAcceptance3] = useState<number | null>(null);
  const [aiAcceptance4, setAiAcceptance4] = useState<number | null>(null);
  const [aiAcceptance5, setAiAcceptance5] = useState<number | null>(null);

  useEffect(() => {
    const id = sessionStorage.getItem('participantId');
    setParticipantId(id);
  }, []);

  const handleLanguageChange = (language: string, checked: any) => {
    if (checked) {
      setLanguages([...languages, language]);
    } else {
      setLanguages(languages.filter(l => l !== language));
    }
  };

  const handleRaceEthnicityChange = (race: string) => {
    setRaceEthnicity(race);
  };

  const handleToolsChange = (tool: string, checked: any) => {
    if (checked) {
      setToolsUsed([...toolsUsed, tool]);
    } else {
      setToolsUsed(toolsUsed.filter(t => t !== tool));
    }
  };

  const handleMultiAgentTypesChange = (type: string, checked: any) => {
    if (checked) {
      setMultiAgentTypes([...multiAgentTypes, type]);
    } else {
      setMultiAgentTypes(multiAgentTypes.filter(t => t !== type));
    }
  };

  const validateForm = () => {
    const errors: string[] = [];

    // Basic Demographics validation
    if (!age.trim()) errors.push('Age is required');
    if (parseInt(age) < 1) errors.push('Age must be 1 or greater');
    if (!gender) errors.push('Gender is required');
    if (!education) errors.push('Education level is required');
    if (!occupation.trim()) errors.push('Occupation is required');
    if (!country) errors.push('Country is required');
    if (languages.length === 0) errors.push('Please select at least one language');
    if (englishProficiency === null) errors.push('English proficiency is required');
    if (!raceEthnicity) errors.push('Race/Ethnicity is required');

    // AI / Multi-Agent Experience validation
    if (llmUsage === null) errors.push('Please rate your LLM usage frequency');
    if (multiAgentExperience === '') errors.push('Please select your multi-agent experience level');

    // Individual Difference Measures validation
    if (sii1 === null) errors.push('Please answer SII question 1');
    if (sii2 === null) errors.push('Please answer SII question 2');
    if (sii3 === null) errors.push('Please answer SII question 3');
    if (sii4 === null) errors.push('Please answer SII question 4');
    if (nfc1 === null) errors.push('Please answer NFC question 1');
    if (nfc2 === null) errors.push('Please answer NFC question 2');
    if (nfc3 === null) errors.push('Please answer NFC question 3');
    if (nfc4 === null) errors.push('Please answer NFC question 4');
    if (nfc5 === null) errors.push('Please answer NFC question 5');
    if (nfc6 === null) errors.push('Please answer NFC question 6');
    if (aiAcceptance1 === null) errors.push('Please answer AI Acceptance question 1');
    if (aiAcceptance2 === null) errors.push('Please answer AI Acceptance question 2');
    if (aiAcceptance3 === null) errors.push('Please answer AI Acceptance question 3');
    if (aiAcceptance4 === null) errors.push('Please answer AI Acceptance question 4');
    if (aiAcceptance5 === null) errors.push('Please answer AI Acceptance question 5');

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async () => {
    if (!participantId) return;

    if (!validateForm()) {
      alert(`Please complete all required fields:\n\n${validationErrors.join('\n')}`);
      return;
    }

    setIsSubmitting(true);

    try {
      // Log survey responses
      await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId,
          type: 'background_survey',
          payload: {
            // Basic Demographics
            age,
            gender,
            education,
            occupation,
            country,
            languages,
            englishProficiency,
            raceEthnicity,
            raceOther,
            
            // AI / Multi-Agent Experience
            llmUsage,
            toolsUsed,
            toolsOther,
            multiAgentExperience,
            multiAgentTypes,
            multiAgentOther,
            multiAgentOpenEnded,
            
            // Individual Difference Measures
            sii: [sii1, sii2, sii3, sii4],
            nfc: [nfc1, nfc2, nfc3, nfc4, nfc5, nfc6],
            aiAcceptance: [aiAcceptance1, aiAcceptance2, aiAcceptance3, aiAcceptance4, aiAcceptance5],
          }
        })
      });

      // Persist background survey to dedicated table (all fields)
      await fetch('/api/surveys/background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participant_id: participantId,
          age: Number(age),
          gender,
          education,
          occupation,
          country,
          languages,
          englishProficiency,
          raceEthnicity,
          raceOther,
          llmUsage,
          toolsUsed,
          toolsOther,
          multiAgentExperience,
          multiAgentTypes,
          multiAgentOther,
          multiAgentOpenEnded,
          sii: [sii1, sii2, sii3, sii4],
          nfc: [nfc1, nfc2, nfc3, nfc4, nfc5, nfc6],
          aiAcceptance: [aiAcceptance1, aiAcceptance2, aiAcceptance3, aiAcceptance4, aiAcceptance5],
        })
      });

      // Navigate to practice session
      router.push('/session/test');
    } catch (error) {
      console.error('Error submitting survey:', error);
      alert('Failed to submit survey. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    router.push('/session/test');
  };

  if (!participantId) {
    return <div>Loading...</div>;
  }

  const render7PointLikert = (value: number | null, onChange: (value: number) => void, label: string) => (
    <div className="space-y-3">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="grid grid-cols-7 gap-2">
        {[1, 2, 3, 4, 5, 6, 7].map((scale) => (
          <div key={scale} className="text-center">
            <input
              type="radio"
              id={`${label}-${scale}`}
              name={label}
              value={scale}
              checked={value === scale}
              onChange={(e) => onChange(Number(e.target.value))}
              className="sr-only"
            />
            <label
              htmlFor={`${label}-${scale}`}
              className={`block w-full p-2 text-xs border rounded cursor-pointer transition-colors ${
                value === scale
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {scale}
            </label>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <ProgressHeader
        currentStep="Background Survey"
        totalSteps={13}
        currentStepIndex={2}
      />

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            Background Information Survey
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="text-center mb-6">
            <p className="text-muted-foreground">
              Please provide some information about yourself and your experience with AI systems.
            </p>
            <p className="text-sm text-red-600 mt-2">
              * All fields marked with an asterisk are required
            </p>
          </div>

          {/* 1. Basic Demographics */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold border-b pb-2">1. Basic Demographics</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="age">Age *</Label>
                <Input
                  id="age"
                  type="number"
                  min="1"
                  placeholder="Please enter your age in years"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Gender *</Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger>
                    <SelectValue placeholder="What is your gender?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="non-binary">Non-binary/Genderqueer</SelectItem>
                    <SelectItem value="prefer-not-to-answer">Prefer not to answer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Education Level *</Label>
                <Select value={education} onValueChange={setEducation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Please select your highest level of education" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high-school-or-below">High school or below</SelectItem>
                    <SelectItem value="undergraduate">Undergraduate (in progress or completed)</SelectItem>
                    <SelectItem value="masters">Master's (in progress or completed)</SelectItem>
                    <SelectItem value="doctorate">Doctorate (in progress or completed)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="occupation">Occupation *</Label>
                <Input
                  id="occupation"
                  placeholder="Please write your current main occupation or activity"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Country of Residence *</Label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger>
                    <SelectValue placeholder="Please select your current country of residence" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="united-states">United States</SelectItem>
                    <SelectItem value="canada">Canada</SelectItem>
                    <SelectItem value="united-kingdom">United Kingdom</SelectItem>
                    <SelectItem value="germany">Germany</SelectItem>
                    <SelectItem value="france">France</SelectItem>
                    <SelectItem value="japan">Japan</SelectItem>
                    <SelectItem value="south-korea">South Korea</SelectItem>
                    <SelectItem value="china">China</SelectItem>
                    <SelectItem value="india">India</SelectItem>
                    <SelectItem value="australia">Australia</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <Label>Primary Language(s) *</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Korean', 'Arabic', 'Hindi', 'Portuguese', 'Russian', 'Other'].map((lang) => (
                  <div key={lang} className="flex items-center space-x-2">
                    <Checkbox
                      id={`lang-${lang}`}
                      checked={languages.includes(lang)}
                      onCheckedChange={(checked) => handleLanguageChange(lang, checked as boolean)}
                    />
                    <Label htmlFor={`lang-${lang}`} className="text-sm">{lang}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {render7PointLikert(englishProficiency, setEnglishProficiency, "* How would you rate your English proficiency?")}
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Not at all proficient</span>
                <span>Native-like proficiency</span>
              </div>
            </div>

            <div className="space-y-4">
              <Label>Race/Ethnicity *</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {['Asian', 'White', 'Black/African', 'Hispanic/Latinx', 'Middle Eastern/North African', 'Indigenous/Mixed', 'Other', 'Prefer not to answer'].map((race) => (
                  <div key={race} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id={`race-${race}`}
                      name="raceEthnicity"
                      value={race}
                      checked={raceEthnicity === race}
                      onChange={(e) => handleRaceEthnicityChange(e.target.value)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <Label htmlFor={`race-${race}`} className="text-sm">{race}</Label>
                  </div>
                ))}
              </div>
              {raceEthnicity === 'Other' && (
                <Input
                  placeholder="Please specify"
                  value={raceOther}
                  onChange={(e) => setRaceOther(e.target.value)}
                />
              )}
            </div>
          </div>

          {/* 2. AI / Multi-Agent Experience */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold border-b pb-2">2. AI / Multi-Agent Experience</h3>
            
            {render7PointLikert(llmUsage, setLlmUsage, "How often have you used LLM chatbots (e.g., ChatGPT, Claude, Gemini) in the past 6 months? *")}

            <div className="space-y-4">
              <Label>Which tools have you used?</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {['ChatGPT', 'Claude', 'Gemini', 'Grok', 'Other', 'None'].map((tool) => (
                  <div key={tool} className="flex items-center space-x-2">
                    <Checkbox
                      id={`tool-${tool}`}
                      checked={toolsUsed.includes(tool)}
                      onCheckedChange={(checked) => handleToolsChange(tool, checked as boolean)}
                    />
                    <Label htmlFor={`tool-${tool}`} className="text-sm">{tool}</Label>
                  </div>
                ))}
              </div>
              {toolsUsed.includes('Other') && (
                <Input
                  placeholder="Please specify"
                  value={toolsOther}
                  onChange={(e) => setToolsOther(e.target.value)}
                />
              )}
            </div>

            <div className="space-y-2">
              <Label>Have you ever interacted with two or more AI/chatbots at the same time? *</Label>
              <Select value={multiAgentExperience} onValueChange={setMultiAgentExperience}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your experience level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">Never</SelectItem>
                  <SelectItem value="only-heard">Only heard of it</SelectItem>
                  <SelectItem value="tried-briefly">Tried briefly</SelectItem>
                  <SelectItem value="frequently-used">Frequently used / Research experience</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <Label>Types of Multi-Agent Experience</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  'Role-divided chatbots (e.g., expert/novice)',
                  'Debate/Collaboration simulation agents',
                  'Emotional support multi-characters',
                  'Coding/Learning/Productivity assistants',
                  'Self-developed for research/production',
                  'Other'
                ].map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`type-${type}`}
                      checked={multiAgentTypes.includes(type)}
                      onCheckedChange={(checked) => handleMultiAgentTypesChange(type, checked as boolean)}
                    />
                    <Label htmlFor={`type-${type}`} className="text-sm">{type}</Label>
                  </div>
                ))}
              </div>
              {multiAgentTypes.includes('Other') && (
                <Input
                  placeholder="Please specify"
                  value={multiAgentOther}
                  onChange={(e) => setMultiAgentOther(e.target.value)}
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="multi-agent-open">If you had any memorable experiences with multi-agent systems, please describe briefly. (Optional)</Label>
              <Textarea
                id="multi-agent-open"
                placeholder="Please describe your experiences..."
                value={multiAgentOpenEnded}
                onChange={(e) => setMultiAgentOpenEnded(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>

          {/* 3. Individual Difference Measures */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold border-b pb-2">3. Individual Difference Measures</h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-4">Susceptibility to Interpersonal Influence (SII-4) *</h4>
                <div className="space-y-4">
                  {render7PointLikert(sii1, setSii1, "I often buy products recommended by my friends.")}
                  {render7PointLikert(sii2, setSii2, "If others say something is good, I tend to see it positively.")}
                  {render7PointLikert(sii3, setSii3, "My choices are often influenced by others' opinions.")}
                  {render7PointLikert(sii4, setSii4, "I am often swayed by others' opinions.")}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-4">Need for Cognition (NFC-6) *</h4>
                <div className="space-y-4">
                  {render7PointLikert(nfc1, setNfc1, "I enjoy solving complex problems.")}
                  {render7PointLikert(nfc2, setNfc2, "I find reading challenging books interesting.")}
                  {render7PointLikert(nfc3, setNfc3, "I enjoy tasks that require a lot of thinking.")}
                  {render7PointLikert(nfc4, setNfc4, "I prefer decisions that are based on thorough analysis.")}
                  {render7PointLikert(nfc5, setNfc5, "I like to think deeply about new ideas.")}
                  {render7PointLikert(nfc6, setNfc6, "I find complex discussions interesting.")}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-4">AI Acceptance (Short Scale, 5 items) *</h4>
                <div className="space-y-4">
                  {render7PointLikert(aiAcceptance1, setAiAcceptance1, "AI has many beneficial applications.")}
                  {render7PointLikert(aiAcceptance2, setAiAcceptance2, "AI is helpful in daily life.")}
                  {render7PointLikert(aiAcceptance3, setAiAcceptance3, "I want to interact with AI in my everyday life.")}
                  {render7PointLikert(aiAcceptance4, setAiAcceptance4, "Society will benefit from AI.")}
                  {render7PointLikert(aiAcceptance5, setAiAcceptance5, "I am willing to delegate part of complex decisions to AI.")}
                </div>
              </div>
            </div>
          </div>

          <div className="text-center pt-6 space-y-3">
            <Button onClick={handleSubmit} disabled={isSubmitting} size="lg">
              {isSubmitting ? 'Submitting...' : 'Continue to Practice Session'}
            </Button>
            
            {/* TEST MODE SKIP BUTTON */}
            <div className="border-t pt-4">
              <Button 
                onClick={handleSkip}
                variant="outline"
                className="text-orange-600 border-orange-300 hover:bg-orange-50"
              >
                <SkipForward className="h-4 w-4 mr-2" />
                Skip to Practice Session (Test Mode)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
