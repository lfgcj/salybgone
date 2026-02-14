import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import type { SessionPayload, MagicLinkToken } from "./types";

const SESSION_COOKIE = "salybgone_session";
const SESSION_DURATION_DAYS = 30;
const MAGIC_LINK_EXPIRY_MINUTES = 15;
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

const DATA_DIR = path.join(process.cwd(), "data");
const TOKENS_FILE = path.join(DATA_DIR, "magic-tokens.json");
const RATE_LIMITS_FILE = path.join(DATA_DIR, "rate-limits.json");

function getSecret(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readTokens(): MagicLinkToken[] {
  ensureDataDir();
  if (!fs.existsSync(TOKENS_FILE)) return [];
  return JSON.parse(fs.readFileSync(TOKENS_FILE, "utf-8"));
}

function writeTokens(tokens: MagicLinkToken[]) {
  ensureDataDir();
  fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2));
}

interface RateLimitEntry {
  email: string;
  timestamps: number[];
}

function readRateLimits(): RateLimitEntry[] {
  ensureDataDir();
  if (!fs.existsSync(RATE_LIMITS_FILE)) return [];
  return JSON.parse(fs.readFileSync(RATE_LIMITS_FILE, "utf-8"));
}

function writeRateLimits(limits: RateLimitEntry[]) {
  ensureDataDir();
  fs.writeFileSync(RATE_LIMITS_FILE, JSON.stringify(limits, null, 2));
}

export function checkRateLimit(email: string): boolean {
  const limits = readRateLimits();
  const now = Date.now();
  const entry = limits.find((l) => l.email === email);

  if (!entry) return true;

  const recentRequests = entry.timestamps.filter(
    (ts) => now - ts < RATE_LIMIT_WINDOW_MS
  );

  return recentRequests.length < RATE_LIMIT_MAX;
}

export function recordRateLimitHit(email: string) {
  const limits = readRateLimits();
  const now = Date.now();
  const entry = limits.find((l) => l.email === email);

  if (entry) {
    entry.timestamps = entry.timestamps
      .filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS)
      .concat(now);
  } else {
    limits.push({ email, timestamps: [now] });
  }

  writeRateLimits(limits);
}

export function createMagicLinkToken(email: string): string {
  const token = uuidv4();
  const tokens = readTokens();

  // Remove expired tokens for this email
  const validTokens = tokens.filter(
    (t) => t.expiresAt > Date.now() && t.email !== email
  );

  validTokens.push({
    token,
    email,
    expiresAt: Date.now() + MAGIC_LINK_EXPIRY_MINUTES * 60 * 1000,
    used: false,
  });

  writeTokens(validTokens);
  return token;
}

export function verifyMagicLinkToken(
  token: string
): { valid: true; email: string } | { valid: false; error: string } {
  const tokens = readTokens();
  const entry = tokens.find((t) => t.token === token);

  if (!entry) {
    return { valid: false, error: "Invalid token" };
  }

  if (entry.used) {
    return { valid: false, error: "Token already used" };
  }

  if (entry.expiresAt < Date.now()) {
    return { valid: false, error: "Token expired" };
  }

  // Mark as used (single-use)
  entry.used = true;
  writeTokens(tokens);

  return { valid: true, email: entry.email };
}

export async function createSession(
  email: string,
  stripeCustomerId: string
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const jwt = await new SignJWT({
    email,
    stripeCustomerId,
  } as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setExpirationTime(`${SESSION_DURATION_DAYS}d`)
    .sign(getSecret());

  return jwt;
}

export function setSessionCookie(token: string) {
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
    path: "/",
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export function clearSession() {
  cookies().delete(SESSION_COOKIE);
}
