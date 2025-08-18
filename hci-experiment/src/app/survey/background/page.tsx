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
  const [formData, setFormData] = useState({
    age: '',
    gender: '',
    education: '',
    occupation: '',
    political_views: '',
    social_media_usage: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const storedParticipantId = sessionStorage.getItem('participantId');
    if (!storedParticipantId) {
      router.push('/entry');
      return;
    }
    setParticipantId(storedParticipantId);
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Log survey completion
      await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId,
          type: 'survey_background_completed',
          payload: formData
        })
      });

      router.push('/session/test');
    } catch (error) {
      console.error('Survey submission error:', error);
      alert('Failed to submit survey. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!participantId) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <ProgressHeader
        currentStep="Background Survey"
        totalSteps={9}
        currentStepIndex={2}
      />

      <Card>
        <CardHeader>
          <CardTitle>Background Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                min="18"
                max="100"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="education">Highest Education Level</Label>
              <Select value={formData.education} onValueChange={(value) => setFormData({ ...formData, education: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select education level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high_school">High School</SelectItem>
                  <SelectItem value="some_college">Some College</SelectItem>
                  <SelectItem value="bachelors">Bachelor's Degree</SelectItem>
                  <SelectItem value="masters">Master's Degree</SelectItem>
                  <SelectItem value="doctorate">Doctorate</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="occupation">Occupation</Label>
              <Input
                id="occupation"
                value={formData.occupation}
                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                placeholder="e.g., Student, Engineer, Teacher"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="political_views">Political Views</Label>
              <Select value={formData.political_views} onValueChange={(value) => setFormData({ ...formData, political_views: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select political views" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="very_liberal">Very Liberal</SelectItem>
                  <SelectItem value="liberal">Liberal</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="conservative">Conservative</SelectItem>
                  <SelectItem value="very_conservative">Very Conservative</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="social_media_usage">Social Media Usage</Label>
              <Select value={formData.social_media_usage} onValueChange={(value) => setFormData({ ...formData, social_media_usage: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select usage level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">Never</SelectItem>
                  <SelectItem value="rarely">Rarely</SelectItem>
                  <SelectItem value="sometimes">Sometimes</SelectItem>
                  <SelectItem value="often">Often</SelectItem>
                  <SelectItem value="very_often">Very Often</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Submitting...' : 'Continue to Experiment'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
