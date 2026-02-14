import fs from "fs";
import path from "path";
import { getKV } from "./kv";
import type { Subscriber } from "./types";

// Redis key prefixes
const KEY_EMAIL = "sub:email:";
const KEY_CUST = "sub:cust:";
const KEY_SID = "sub:sid:";

// File-based fallback for local development
const DATA_DIR = path.join(process.cwd(), "data");
const SUBSCRIBERS_FILE = path.join(DATA_DIR, "subscribers.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(SUBSCRIBERS_FILE)) {
    fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify([], null, 2));
  }
}

function readSubscribers(): Subscriber[] {
  ensureDataDir();
  const data = fs.readFileSync(SUBSCRIBERS_FILE, "utf-8");
  return JSON.parse(data);
}

function writeSubscribers(subscribers: Subscriber[]) {
  ensureDataDir();
  fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(subscribers, null, 2));
}

export async function addSubscriber(
  email: string,
  stripeCustomerId: string,
  stripeSubscriptionId: string
): Promise<Subscriber> {
  const kv = getKV();

  if (kv) {
    const existing = await kv.get<Subscriber>(`${KEY_EMAIL}${email}`);
    const now = new Date().toISOString();
    const subscriber: Subscriber = existing
      ? { ...existing, stripeCustomerId, stripeSubscriptionId, status: "active", updatedAt: now }
      : { email, stripeCustomerId, stripeSubscriptionId, status: "active", createdAt: now, updatedAt: now };

    await Promise.all([
      kv.set(`${KEY_EMAIL}${email}`, subscriber),
      kv.set(`${KEY_CUST}${stripeCustomerId}`, email),
      kv.set(`${KEY_SID}${stripeSubscriptionId}`, email),
    ]);

    return subscriber;
  }

  // File fallback for local development
  const subscribers = readSubscribers();
  const existing = subscribers.find((s) => s.email === email);

  if (existing) {
    existing.stripeCustomerId = stripeCustomerId;
    existing.stripeSubscriptionId = stripeSubscriptionId;
    existing.status = "active";
    existing.updatedAt = new Date().toISOString();
    writeSubscribers(subscribers);
    return existing;
  }

  const subscriber: Subscriber = {
    email,
    stripeCustomerId,
    stripeSubscriptionId,
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  subscribers.push(subscriber);
  writeSubscribers(subscribers);
  return subscriber;
}

export async function getSubscriber(
  email: string
): Promise<Subscriber | null> {
  const kv = getKV();

  if (kv) {
    return await kv.get<Subscriber>(`${KEY_EMAIL}${email}`) || null;
  }

  const subscribers = readSubscribers();
  return subscribers.find((s) => s.email === email) || null;
}

export async function getSubscriberByCustomerId(
  customerId: string
): Promise<Subscriber | null> {
  const kv = getKV();

  if (kv) {
    const email = await kv.get<string>(`${KEY_CUST}${customerId}`);
    if (!email) return null;
    return await kv.get<Subscriber>(`${KEY_EMAIL}${email}`) || null;
  }

  const subscribers = readSubscribers();
  return subscribers.find((s) => s.stripeCustomerId === customerId) || null;
}

export async function updateSubscriberStatus(
  stripeSubscriptionId: string,
  status: Subscriber["status"]
): Promise<Subscriber | null> {
  const kv = getKV();

  if (kv) {
    const email = await kv.get<string>(`${KEY_SID}${stripeSubscriptionId}`);
    if (!email) return null;
    const subscriber = await kv.get<Subscriber>(`${KEY_EMAIL}${email}`);
    if (!subscriber) return null;
    subscriber.status = status;
    subscriber.updatedAt = new Date().toISOString();
    await kv.set(`${KEY_EMAIL}${email}`, subscriber);
    return subscriber;
  }

  // File fallback for local development
  const subscribers = readSubscribers();
  const subscriber = subscribers.find(
    (s) => s.stripeSubscriptionId === stripeSubscriptionId
  );
  if (!subscriber) return null;
  subscriber.status = status;
  subscriber.updatedAt = new Date().toISOString();
  writeSubscribers(subscribers);
  return subscriber;
}

export async function updateSubscriberByCustomerId(
  customerId: string,
  status: Subscriber["status"]
): Promise<Subscriber | null> {
  const kv = getKV();

  if (kv) {
    const email = await kv.get<string>(`${KEY_CUST}${customerId}`);
    if (!email) return null;
    const subscriber = await kv.get<Subscriber>(`${KEY_EMAIL}${email}`);
    if (!subscriber) return null;
    subscriber.status = status;
    subscriber.updatedAt = new Date().toISOString();
    await kv.set(`${KEY_EMAIL}${email}`, subscriber);
    return subscriber;
  }

  // File fallback for local development
  const subscribers = readSubscribers();
  const subscriber = subscribers.find(
    (s) => s.stripeCustomerId === customerId
  );
  if (!subscriber) return null;

  subscriber.status = status;
  subscriber.updatedAt = new Date().toISOString();
  writeSubscribers(subscribers);
  return subscriber;
}

export async function isActiveSubscriber(email: string): Promise<boolean> {
  const subscriber = await getSubscriber(email);
  return subscriber?.status === "active";
}
