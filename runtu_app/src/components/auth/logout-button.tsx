"use client";

import { logout } from "@/app/actions/auth";

interface LogoutButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export function LogoutButton({ className, children }: LogoutButtonProps) {
  return (
    <form action={logout}>
      <button
        type="submit"
        className={className || "text-white/60 hover:text-white transition-colors"}
      >
        {children || "Cerrar sesión"}
      </button>
    </form>
  );
}
