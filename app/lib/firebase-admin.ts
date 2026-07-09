import "server-only";

import { cert, getApps, initializeApp, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

type ServiceAccountShape = {
  project_id?: string;
  projectId?: string;
  client_email?: string;
  clientEmail?: string;
  private_key?: string;
  privateKey?: string;
};

function normalizePrivateKey(value?: string) {
  if (!value) return undefined;
  let key = value.trim();
  if (key.startsWith('"') && key.endsWith('"')) {
    key = key.slice(1, -1);
  }
  if (key.startsWith("'") && key.endsWith("'")) {
    key = key.slice(1, -1);
  }
  return key.replace(/\\n/g, "\n");
}

function readServiceAccountFromJson() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.trim();
  if (!raw) return null;

  const json = raw.startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf-8");
  const parsed = JSON.parse(json) as ServiceAccountShape;

  const email = parsed.client_email ?? parsed.clientEmail;
  const correctedEmail = (email && email.startsWith("-adminsdk")) ? `firebase${email}` : email;

  return {
    projectId: parsed.project_id ?? parsed.projectId,
    clientEmail: correctedEmail,
    privateKey: normalizePrivateKey(parsed.private_key ?? parsed.privateKey),
  };
}

function readServiceAccountFromParts() {
  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
    return null;
  }

  const email = process.env.FIREBASE_CLIENT_EMAIL;
  const correctedEmail = (email && email.startsWith("-adminsdk")) ? `firebase${email}` : email;

  return {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: correctedEmail,
    privateKey: normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY),
  };
}

export function getServiceAccountDiagnostics() {
  try {
    const sa = readServiceAccountFromJson() ?? readServiceAccountFromParts();
    return {
      hasConfig: hasFirebaseAdminConfig(),
      hasServiceAccount: !!sa,
      projectId: sa?.projectId || "not set",
      clientEmail: sa?.clientEmail || "not set",
      hasPrivateKey: !!sa?.privateKey,
      privateKeyLength: sa?.privateKey?.length || 0,
      privateKeyStartsWith: sa?.privateKey ? sa.privateKey.substring(0, 35) : "not set",
    };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export function hasFirebaseAdminConfig() {
  return Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
    (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
  );
}

function getAdminApp() {
  const existing = getApps()[0];
  if (existing) return existing;

  const serviceAccount = readServiceAccountFromJson() ?? readServiceAccountFromParts();
  if (serviceAccount) {
    return initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.projectId,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET ?? process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  }

  return initializeApp({
    credential: applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET ?? process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}

export function getAdminDb() {
  return getFirestore(getAdminApp());
}

export function getAdminStorageBucket(bucketName?: string) {
  return getStorage(getAdminApp()).bucket(bucketName);
}

export async function verifyRequestUser(req: Request) {
  if (!hasFirebaseAdminConfig()) {
    throw new AuthRequestError("FIREBASE_NOT_CONFIGURED", "Firebase backend is not configured.", 503);
  }

  const header = req.headers.get("authorization") ?? "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new AuthRequestError("AUTH_REQUIRED", "Sign in with Google before scraping leads.", 401);
  }

  try {
    return await getAdminAuth().verifyIdToken(token);
  } catch (error) {
    console.error("verifyIdToken failed:", error);

    let tokenAudience = "unknown";
    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
        tokenAudience = payload.aud || "unknown";
      }
    } catch {}

    const sa = readServiceAccountFromJson() ?? readServiceAccountFromParts();
    const clientProj = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "not set";
    const serverProj = process.env.FIREBASE_PROJECT_ID || "not set";
    const saProj = sa?.projectId || "not set";

    const detailMsg = `Your login session expired. Sign in again. (Details: Client Project ID = "${clientProj}", Token Audience = "${tokenAudience}", Server Project ID = "${serverProj}", Service Account Project ID = "${saProj}", Error = ${(error as Error).message})`;

    throw new AuthRequestError(
      "INVALID_AUTH_TOKEN",
      detailMsg,
      401,
    );
  }
}

export class AuthRequestError extends Error {
  constructor(
    public code: "AUTH_REQUIRED" | "INVALID_AUTH_TOKEN" | "FIREBASE_NOT_CONFIGURED",
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "AuthRequestError";
  }
}
