import { verifyToken } from "@clerk/backend";

export function bearerToken(req) {
  return req.headers.authorization?.replace(/^Bearer\s+/i, "").trim() || "";
}

export async function requireUser(req) {
  const token = bearerToken(req);
  if (!token || !process.env.CLERK_SECRET_KEY) return null;

  try {
    const claims = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
    return typeof claims.sub === "string" ? { id: claims.sub, sessionId: claims.sid ?? null } : null;
  } catch {
    return null;
  }
}

