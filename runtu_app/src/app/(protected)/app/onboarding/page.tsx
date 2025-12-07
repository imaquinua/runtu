import { redirect } from "next/navigation";
import { checkOnboardingStatus } from "@/app/actions/business";
import { OnboardingForm } from "./onboarding-form";
import { RuntuLogo } from "@/components/ui/runtu-logo";

export default async function OnboardingPage() {
  const { needsOnboarding, business } = await checkOnboardingStatus();

  // If user already completed onboarding, redirect to dashboard
  if (!needsOnboarding && business) {
    redirect("/app/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center px-4">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(251,191,36,0.08),transparent_50%)]" />
      </div>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <RuntuLogo variant="header" size="md" />
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">
              Cuéntanos sobre tu negocio
            </h1>
            <p className="text-white/60">
              Esta información nos ayuda a personalizar tu experiencia
            </p>
          </div>

          <OnboardingForm />
        </div>

        {/* Footer note */}
        <p className="text-center text-white/40 text-sm mt-6">
          Podrás cambiar esto después en la configuración
        </p>
      </div>
    </div>
  );
}
