
import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";

createRoot(document.getElementById("root")!).render(
  <App />
);

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, { once: true });
}
