import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let businessName = "Mi Negocio";

  // Fetch business name if Supabase is configured
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder.supabase.co"
  ) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: business } = await supabase
          .from("businesses")
          .select("name")
          .eq("user_id", user.id)
          .single();

        if (business?.name) {
          businessName = business.name;
        }
      }
    } catch {
      // Silently fail if database is not set up
    }
  }

  return <DashboardShell businessName={businessName}>{children}</DashboardShell>;
}
