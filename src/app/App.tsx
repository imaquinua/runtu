import { lazy, Suspense } from "react";
import { Incubadora } from "./pages/Incubadora";

const LabRouter = lazy(() => import("./pages/LabRouter"));

function RouteLoading() {
  return <div role="status" style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#171219", color: "#FDFAF2", fontFamily: "monospace" }}>ABRIENDO EL LAB…</div>;
}

export default function App() {
  const path = window.location.pathname;
  if (path.startsWith("/lab") || path.startsWith("/a/")) {
    return <Suspense fallback={<RouteLoading />}><LabRouter path={path} /></Suspense>;
  }
  return <Incubadora />;
}
