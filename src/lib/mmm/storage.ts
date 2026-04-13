import { supabase } from "../supabase";
import type { MMMResult } from "./types";

export async function saveMMMAnalysis(
  businessId: string,
  result: MMMResult,
  rawRows: Record<string, string>[]
): Promise<{ id: string | null; error: string | null }> {
  const { data, error } = await supabase
    .from("mmm_analyses")
    .insert({
      business_id: businessId,
      filename: result.filename,
      channels: result.channels.map((c) => c.name),
      raw_data: rawRows,
      results: result,
    })
    .select("id")
    .single();

  if (error) return { id: null, error: error.message };
  return { id: data?.id ?? null, error: null };
}

export async function getLatestMMMAnalysis(
  businessId: string
): Promise<{ result: MMMResult | null; id: string | null; error: string | null }> {
  const { data, error } = await supabase
    .from("mmm_analyses")
    .select("id, results")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return { result: null, id: null, error: error.message };
  if (!data) return { result: null, id: null, error: null };
  return { result: data.results as MMMResult, id: data.id, error: null };
}

export async function listMMMAnalyses(businessId: string) {
  const { data, error } = await supabase
    .from("mmm_analyses")
    .select("id, filename, created_at, channels")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });
  return { data, error };
}
