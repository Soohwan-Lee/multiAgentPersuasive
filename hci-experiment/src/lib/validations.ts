import { z } from 'zod';

export const turnRequestSchema = z.object({
  participantId: z.string().uuid(),
  sessionKey: z.enum(['test', 'main1', 'main2']),
  turnIndex: z.number().int().min(0).max(3),
  userMessage: z.string().min(1).max(1000),
});

export const stateRequestSchema = z.object({
  participantId: z.string().uuid(),
});

export const participantUpsertSchema = z.object({
  prolific_pid: z.string(),
  study_id: z.string(),
  session_id: z.string(),
});

export const surveyBackgroundSchema = z.object({
  age: z.number().int().min(18).max(100),
  gender: z.string().min(1),
  education: z.string().min(1),
  occupation: z.string().min(1),
  political_views: z.string().min(1),
  social_media_usage: z.string().min(1),
});

export const surveyPostSelfSchema = z.object({
  persuasion_effectiveness: z.number().int().min(1).max(7),
  agent_credibility: z.number().int().min(1).max(7),
  decision_confidence: z.number().int().min(1).max(7),
  overall_satisfaction: z.number().int().min(1).max(7),
});

export const surveyPostOpenSchema = z.object({
  thoughts_on_experiment: z.string().min(1).max(2000),
  agent_comparison: z.string().min(1).max(2000),
  suggestions: z.string().min(1).max(2000),
});

export const turnChoiceSchema = z.object({
  public_choice: z.string().min(1),
  public_conf: z.number().int().min(0).max(100),
  private_belief: z.string().optional(),
  private_conf: z.number().int().min(0).max(100).optional(),
});
