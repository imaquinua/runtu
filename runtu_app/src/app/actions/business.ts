"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function completeOnboarding(formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "No autenticado" };
  }

  const name = formData.get("name") as string;
  const industry = formData.get("industry") as string;

  if (!name || name.trim().length < 2) {
    return { error: "El nombre del negocio debe tener al menos 2 caracteres" };
  }

  if (!industry) {
    return { error: "Selecciona una industria" };
  }

  // Update the business record (created by trigger on signup)
  const { error } = await supabase
    .from("businesses")
    .update({
      name: name.trim(),
      industry,
    })
    .eq("user_id", user.id);

  if (error) {
    // If no business exists, create one
    if (error.code === "PGRST116") {
      const { error: insertError } = await supabase
        .from("businesses")
        .insert({
          user_id: user.id,
          name: name.trim(),
          industry,
        });

      if (insertError) {
        return { error: insertError.message };
      }
    } else {
      return { error: error.message };
    }
  }

  revalidatePath("/app", "layout");
  redirect("/app/dashboard");
}

export async function checkOnboardingStatus() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { needsOnboarding: false, business: null };
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // User needs onboarding if:
  // 1. No business exists, OR
  // 2. Business has default name "Mi Negocio" and no industry
  const needsOnboarding = !business ||
    (business.name === "Mi Negocio" && !business.industry);

  return { needsOnboarding, business };
}
