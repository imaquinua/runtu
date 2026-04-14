import { supabase } from "../supabase";
import type {
  ScrapingJob, ScrapingMention, ScrapingNarrative, ScrapingRun,
  ScrapingJobType, ScrapingPlatform, ScrapingSchedule,
} from "./types";

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("No hay sesión activa");
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

export async function listJobs(): Promise<ScrapingJob[]> {
  const res = await fetch("/api/scraping/jobs", { headers: await authHeaders() });
  if (!res.ok) throw new Error((await res.json()).error ?? "Error listando jobs");
  const json = await res.json();
  return json.jobs;
}

export interface JobDetail {
  job: ScrapingJob;
  mentions: ScrapingMention[];
  narratives: ScrapingNarrative[];
  runs: ScrapingRun[];
}

export async function getJob(id: string): Promise<JobDetail> {
  const res = await fetch(`/api/scraping/jobs?id=${encodeURIComponent(id)}`, { headers: await authHeaders() });
  if (!res.ok) throw new Error((await res.json()).error ?? "Error cargando job");
  return res.json();
}

export async function createJob(body: {
  query: string;
  type: ScrapingJobType;
  platforms: ScrapingPlatform[];
  schedule?: ScrapingSchedule;
}): Promise<ScrapingJob> {
  const res = await fetch("/api/scraping/jobs", {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json()).error ?? "Error creando job");
  const json = await res.json();
  return json.job;
}

export async function updateJob(id: string, patch: { status?: "active" | "paused"; schedule?: ScrapingSchedule }) {
  const res = await fetch(`/api/scraping/jobs?id=${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: await authHeaders(),
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error((await res.json()).error ?? "Error actualizando");
  const json = await res.json();
  return json.job as ScrapingJob;
}

export async function deleteJob(id: string): Promise<void> {
  const res = await fetch(`/api/scraping/jobs?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error((await res.json()).error ?? "Error eliminando");
}
