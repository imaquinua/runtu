import { redirect } from "next/navigation";

// Redirigir /app/inicio al chat - la experiencia principal
export default function InicioPage() {
  redirect("/app/chat");
}
