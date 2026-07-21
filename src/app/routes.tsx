import { createBrowserRouter } from "react-router";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Onboarding } from "./pages/Onboarding";
import { AppShell } from "./components/AppShell";
import { Dashboard } from "./pages/Dashboard";
import { Chat } from "./pages/Chat";
import { SocialScraping } from "./pages/SocialScraping";
import { WebScraping } from "./pages/WebScraping";
import { SocialAnalytics } from "./pages/SocialAnalytics";
import { MMMEngine } from "./pages/MMMEngine";
import { ContentCalendar } from "./pages/ContentCalendar";
import { Integrations } from "./pages/Integrations";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Incubadora } from "./pages/Incubadora";

export const router = createBrowserRouter([
  { path: "/", Component: Landing },
  { path: "/incubadora", Component: Incubadora },
  { path: "/login", Component: Login },
  { path: "/register", Component: Register },
  {
    path: "/app/onboarding",
    element: (
      <ProtectedRoute>
        <Onboarding />
      </ProtectedRoute>
    ),
  },
  {
    path: "/app",
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, Component: Dashboard },
      { path: "chat", Component: Chat },
      { path: "social-scraping", Component: SocialScraping },
      { path: "web-scraping", Component: WebScraping },
      { path: "analytics", Component: SocialAnalytics },
      { path: "mmm", Component: MMMEngine },
      { path: "calendar", Component: ContentCalendar },
      { path: "integrations", Component: Integrations },
    ],
  },
]);
