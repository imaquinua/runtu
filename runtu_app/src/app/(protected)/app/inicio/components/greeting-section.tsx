"use client";

interface GreetingSectionProps {
  userName: string;
}

function getGreeting(): string {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return "Buenos días";
  } else if (hour >= 12 && hour < 19) {
    return "Buenas tardes";
  } else {
    return "Buenas noches";
  }
}

export function GreetingSection({ userName }: GreetingSectionProps) {
  const greeting = getGreeting();

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
        {greeting}, <span className="text-indigo-600">{userName}</span>
      </h1>
      <p className="mt-1 text-gray-500">
        Aquí está el pulso de tu negocio
      </p>
    </div>
  );
}
