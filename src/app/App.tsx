import { Incubadora } from "./pages/Incubadora";
import { Lab } from "./pages/Lab";

export default function App() {
  return window.location.pathname.startsWith("/lab") ? <Lab /> : <Incubadora />;
}
