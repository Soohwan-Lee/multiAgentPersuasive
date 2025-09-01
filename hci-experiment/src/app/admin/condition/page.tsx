'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AdminConditionPage() {
  const [participantId, setParticipantId] = useState<string>('');
  const [currentCondition, setCurrentCondition] = useState<string | null>(null);
  const [newCondition, setNewCondition] = useState<string>('majority');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('');

  const handleFetchCondition = async () => {
    if (!participantId.trim()) {
      setMessage('Participant ID를 입력해주세요.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`/api/participants/condition?participantId=${participantId}`);
      if (response.ok) {
        const data = await response.json();
        setCurrentCondition(data.condition);
        setNewCondition(data.condition);
        setMessage(`Current condition: ${data.condition}`);
      } else {
        const errorData = await response.json();
        setMessage(`에러: ${errorData.error}`);
      }
    } catch (error) {
              setMessage('Error occurred while fetching condition.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCondition = async () => {
    if (!participantId.trim()) {
      setMessage('Participant ID를 입력해주세요.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/participants/condition', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participantId,
          condition: newCondition,
        }),
      });

      if (response.ok) {
        setCurrentCondition(newCondition);
        setMessage(`Condition successfully changed to ${newCondition}.`);
      } else {
        const errorData = await response.json();
        setMessage(`에러: ${errorData.error}`);
      }
    } catch (error) {
              setMessage('Error occurred while updating condition.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Experiment Condition Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="participantId">Participant ID</Label>
            <div className="flex space-x-2">
              <input
                id="participantId"
                type="text"
                value={participantId}
                onChange={(e) => setParticipantId(e.target.value)}
                placeholder="Enter participant ID"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
              />
              <Button onClick={handleFetchCondition} disabled={loading}>
                {loading ? 'Loading...' : 'Fetch Condition'}
              </Button>
            </div>
          </div>

          {currentCondition && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <strong>Current condition:</strong> {currentCondition}
              </div>

              <div className="space-y-2">
                <Label htmlFor="newCondition">New Condition</Label>
                <Select value={newCondition} onValueChange={setNewCondition}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="majority">Majority</SelectItem>
                    <SelectItem value="minority">Minority</SelectItem>
                    <SelectItem value="minorityDiffusion">Minority Diffusion</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleUpdateCondition} 
                disabled={loading || currentCondition === newCondition}
                className="w-full"
              >
                {loading ? 'Updating...' : 'Update Condition'}
              </Button>
            </div>
          )}

          {message && (
            <div className={`p-4 rounded-lg ${
              message.includes('에러') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
            }`}>
              {message}
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold mb-2">Question differences by condition:</h3>
            <div className="space-y-2 text-sm">
              <div>
                <strong>Majority:</strong> Perceived Compliance (4개) + Perceived Conversion (4개)
              </div>
              <div>
                <strong>Minority/Minority Diffusion:</strong> Perceived Compliance (4개) + Perceived Conversion (4개) + AI Agent 인식 (14개)
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
