import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { GreetingSection } from "./components/greeting-section";
import { SummaryCards } from "./components/summary-cards";
import { QuickActions } from "./components/quick-actions";
import { RecentActivity } from "./components/recent-activity";
import { RuntuSuggestion } from "./components/runtu-suggestion";
import { SummaryNotificationWrapper } from "@/components/summaries";

// Mock data for now
const mockSummary = {
  filesUploaded: 12,
  lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  questionsAnswered: 8,
  processingFiles: 0,
};

const mockActivities = [
  {
    id: "1",
    type: "file" as const,
    description: "Subiste ventas_noviembre.xlsx",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: "2",
    type: "question" as const,
    description: "Preguntaste: ¿Cuál fue mi mejor día de ventas?",
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
  },
  {
    id: "3",
    type: "report" as const,
    description: "Generaste reporte de gastos mensuales",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
  {
    id: "4",
    type: "file" as const,
    description: "Subiste inventario_diciembre.csv",
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: "5",
    type: "question" as const,
    description: "Preguntaste: ¿Qué producto vendí más?",
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
];

export default async function InicioPage() {
  let userName = "emprendedor";

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();

      if (data.user?.email) {
        // Extract name from email (before @)
        userName = data.user.email.split("@")[0];
      }
    } catch {
      // Silently fail
    }
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Summary Notification */}
      <SummaryNotificationWrapper />

      {/* Greeting */}
      <GreetingSection userName={userName} />

      {/* Summary Cards */}
      <SummaryCards
        filesUploaded={mockSummary.filesUploaded}
        lastActivity={mockSummary.lastActivity}
        questionsAnswered={mockSummary.questionsAnswered}
        processingFiles={mockSummary.processingFiles}
      />

      {/* Quick Actions */}
      <QuickActions />

      {/* Recent Activity */}
      <RecentActivity activities={mockActivities} />

      {/* Runtu Suggestion */}
      <RuntuSuggestion />
    </div>
  );
}
