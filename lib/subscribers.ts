import fs from "fs";
import path from "path";
import type { Subscriber } from "./types";

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
  const subscribers = readSubscribers();
  return subscribers.find((s) => s.email === email) || null;
}

export async function getSubscriberByCustomerId(
  customerId: string
): Promise<Subscriber | null> {
  const subscribers = readSubscribers();
  return subscribers.find((s) => s.stripeCustomerId === customerId) || null;
}

export async function updateSubscriberStatus(
  stripeSubscriptionId: string,
  status: Subscriber["status"]
): Promise<Subscriber | null> {
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
