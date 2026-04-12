// Industry options for onboarding
export const INDUSTRIES = [
  { value: "restaurante", label: "Restaurante" },
  { value: "retail", label: "Retail / Tienda" },
  { value: "educacion", label: "Educación" },
  { value: "servicios", label: "Servicios" },
  { value: "otro", label: "Otro" },
] as const;

export type IndustryValue = (typeof INDUSTRIES)[number]["value"];
