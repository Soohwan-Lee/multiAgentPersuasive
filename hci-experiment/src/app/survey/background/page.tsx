'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProgressHeader } from '@/components/ProgressHeader';

export default function BackgroundSurveyPage() {
  const router = useRouter();
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Survey responses
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [education, setEducation] = useState('');
  const [occupation, setOccupation] = useState('');
  const [politicalViews, setPoliticalViews] = useState('');
  const [socialMediaUsage, setSocialMediaUsage] = useState('');

  useEffect(() => {
    const id = sessionStorage.getItem('participantId');
    setParticipantId(id);
  }, []);

  const handleSubmit = async () => {
    if (!participantId) return;

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
            age,
            gender,
            education,
            occupation,
            politicalViews,
            socialMediaUsage,
          }
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

  if (!participantId) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <ProgressHeader
        currentStep="Background Survey"
        totalSteps={11}
        currentStepIndex={2}
      />

      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            Background Information Survey
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center mb-6">
            <p className="text-muted-foreground">
              Please provide some basic information about yourself. This helps us understand our participants better.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                placeholder="Enter your age"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="education">Education Level</Label>
              <Select value={education} onValueChange={setEducation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select education level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high-school">High School</SelectItem>
                  <SelectItem value="bachelors">Bachelor's Degree</SelectItem>
                  <SelectItem value="masters">Master's Degree</SelectItem>
                  <SelectItem value="phd">PhD</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="occupation">Occupation</Label>
              <Input
                id="occupation"
                placeholder="Enter your occupation"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="political">Political Views</Label>
              <Select value={politicalViews} onValueChange={setPoliticalViews}>
                <SelectTrigger>
                  <SelectValue placeholder="Select political views" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="liberal">Liberal</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="conservative">Conservative</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="social-media">Social Media Usage</Label>
              <Select value={socialMediaUsage} onValueChange={setSocialMediaUsage}>
                <SelectTrigger>
                  <SelectValue placeholder="Select usage level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rarely">Rarely</SelectItem>
                  <SelectItem value="sometimes">Sometimes</SelectItem>
                  <SelectItem value="often">Often</SelectItem>
                  <SelectItem value="very-often">Very Often</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="text-center pt-6">
            <Button onClick={handleSubmit} disabled={isSubmitting} size="lg">
              {isSubmitting ? 'Submitting...' : 'Continue to Practice Session'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
