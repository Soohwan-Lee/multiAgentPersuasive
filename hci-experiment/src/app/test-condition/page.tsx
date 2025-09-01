'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function TestConditionPage() {
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [condition, setCondition] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = sessionStorage.getItem('participantId');
    if (!id) {
      setLoading(false);
      return;
    }
    
    setParticipantId(id);
    
    const fetchCondition = async () => {
      try {
        const response = await fetch(`/api/participants/condition?participantId=${id}`);
        if (response.ok) {
          const data = await response.json();
          setCondition(data.condition);
        }
      } catch (error) {
        console.error('Error fetching condition:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCondition();
  }, []);

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  if (!participantId) {
    return <div className="container mx-auto px-4 py-8">No participant ID found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Experiment Condition Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <strong>Participant ID:</strong> {participantId}
          </div>
          <div>
            <strong>Condition:</strong> {condition || 'Not set'}
          </div>
          <div>
            <strong>Condition Type:</strong> {
              condition === 'majority' ? 'Majority (Perceived Compliance & Conversion only for all conditions)' :
                              condition === 'minority' || condition === 'minorityDiffusion' ? 'Minority (AI Agent recognition questions added)' :
              'Unknown'
            }
          </div>
          
          {condition === 'minority' || condition === 'minorityDiffusion' ? (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold mb-2">Questions displayed in Minority condition:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Perceived Compliance (4 questions)</li>
                <li>Perceived Conversion (4 questions)</li>
                <li>Agent 1 & 2 Recognition (7 items)</li>
                <li>Agent 3 Recognition (7 items)</li>
              </ul>
            </div>
          ) : condition === 'majority' ? (
            <div className="mt-4 p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold mb-2">Questions displayed in Majority condition:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Perceived Compliance (4 questions)</li>
                <li>Perceived Conversion (4 questions)</li>
                <li>AI Agent recognition questions are not displayed</li>
              </ul>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
