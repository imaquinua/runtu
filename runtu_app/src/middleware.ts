import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  // Skip Supabase middleware if not configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co') {
    return NextResponse.next();
  }

  try {
    return await updateSession(request);
  } catch {
    // On any error, continue without blocking
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Only run middleware on protected routes (/app/*)
     * Skip: static files, images, public pages (/, /login, /register)
     */
    "/app/:path*",
  ],
};
