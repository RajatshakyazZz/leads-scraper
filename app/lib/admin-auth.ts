import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Admin authentication helpers.
 *
 * The admin panel is protected by a simple password stored in the
 * `ADMIN_PANEL_PASSWORD` environment variable. On successful login a
 * short-lived HMAC token is returned to the client which must be sent
 * as a Bearer token in all subsequent admin API requests.
 */

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function getSecret(): string {
  const password = process.env.ADMIN_PANEL_PASSWORD;
  if (!password) throw new AdminAuthError("ADMIN_NOT_CONFIGURED", "Admin panel is not configured.", 503);
  return password;
}

/* ------------------------------------------------------------------ */
/*  Password                                                          */
/* ------------------------------------------------------------------ */

export function verifyAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PANEL_PASSWORD;
  if (!expected) return false;

  // Timing-safe comparison
  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/* ------------------------------------------------------------------ */
/*  Token                                                              */
/* ------------------------------------------------------------------ */

export function createAdminToken(): string {
  const secret = getSecret();
  const payload = `${Date.now()}.${randomBytes(16).toString("hex")}`;
  const signature = createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

export function verifyAdminToken(token: string): boolean {
  try {
    const secret = getSecret();
    const parts = token.split(".");
    if (parts.length !== 3) return false;

    const [timestampStr, nonce, signature] = parts;
    const timestamp = Number(timestampStr);
    if (!Number.isFinite(timestamp)) return false;

    // Check expiry
    if (Date.now() - timestamp > TOKEN_TTL_MS) return false;

    // Verify signature
    const payload = `${timestampStr}.${nonce}`;
    const expected = createHmac("sha256", secret).update(payload).digest("hex");

    const sigBuf = Buffer.from(signature, "hex");
    const expectedBuf = Buffer.from(expected, "hex");
    if (sigBuf.length !== expectedBuf.length) return false;
    return timingSafeEqual(sigBuf, expectedBuf);
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/*  Request helper                                                     */
/* ------------------------------------------------------------------ */

export function verifyAdminRequest(req: Request): void {
  const header = req.headers.get("authorization") ?? "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new AdminAuthError("ADMIN_AUTH_REQUIRED", "Admin authentication required.", 401);
  }

  if (!verifyAdminToken(token)) {
    throw new AdminAuthError("ADMIN_TOKEN_INVALID", "Admin session expired. Please log in again.", 401);
  }
}

/* ------------------------------------------------------------------ */
/*  Logging helper                                                     */
/* ------------------------------------------------------------------ */

export async function writeAdminLog(
  db: FirebaseFirestore.Firestore,
  action: string,
  target: string,
  details?: string,
) {
  const { FieldValue } = await import("firebase-admin/firestore");
  await db.collection("logs").add({
    action,
    target,
    details: details ?? null,
    source: "admin",
    createdAt: FieldValue.serverTimestamp(),
  });
}

/* ------------------------------------------------------------------ */
/*  Error class                                                        */
/* ------------------------------------------------------------------ */

export class AdminAuthError extends Error {
  constructor(
    public code: "ADMIN_NOT_CONFIGURED" | "ADMIN_AUTH_REQUIRED" | "ADMIN_TOKEN_INVALID",
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "AdminAuthError";
  }
}
