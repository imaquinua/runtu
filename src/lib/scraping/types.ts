export type ScrapingJobType = "hashtag" | "account" | "keyword";
export type ScrapingPlatform = "instagram" | "tiktok" | "x" | "reddit" | "google-serp";
export type ScrapingJobStatus = "active" | "paused" | "completed" | "error";
export type ScrapingSchedule = "manual" | "hourly" | "daily";

export type Sentiment = "positive" | "neutral" | "negative";

export interface ScrapingJob {
  id: string;
  business_id: string;
  query: string;
  type: ScrapingJobType;
  platforms: ScrapingPlatform[];
  schedule: ScrapingSchedule;
  status: ScrapingJobStatus;
  last_run_at: string | null;
  next_run_at: string | null;
  apify_actor_ids: Record<string, string>;
  created_at: string;
}

export interface ScrapingRun {
  id: string;
  job_id: string;
  apify_run_id: string | null;
  actor_id: string;
  platform: ScrapingPlatform;
  status: "running" | "succeeded" | "failed" | "timed-out";
  started_at: string;
  finished_at: string | null;
  items_count: number;
  error: string | null;
}

export interface MentionEngagement {
  likes?: number;
  comments?: number;
  shares?: number;
  views?: number;
}

export interface ScrapingMention {
  id: string;
  job_id: string;
  run_id: string | null;
  platform: ScrapingPlatform;
  external_id: string;
  author: string | null;
  text: string | null;
  url: string | null;
  engagement: MentionEngagement;
  posted_at: string | null;
  raw?: Record<string, unknown>;
  sentiment: Sentiment | null;
  sentiment_score: number | null;
  topics: string[] | null;
  embedding?: number[];
  processed_at: string | null;
  created_at: string;
}

export interface ScrapingNarrative {
  id: string;
  job_id: string;
  title: string;
  summary: string;
  sentiment_score: number;
  mention_count: number;
  growth_rate: number;
  started_at: string | null;
  last_seen_at: string | null;
  sample_mention_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface NormalizedMention {
  external_id: string;
  author: string | null;
  text: string;
  url: string;
  engagement: MentionEngagement;
  posted_at: string | null;
  raw: Record<string, unknown>;
}

export interface ActorInput {
  actorId: string;
  input: Record<string, unknown>;
}
