import fs from "fs";
import path from "path";
import { getKV } from "./kv";
import type { Profile } from "./types";

const KEY_PREFIX = "profile:";

// File-based fallback for local development
const DATA_DIR = path.join(process.cwd(), "data");
const PROFILES_FILE = path.join(DATA_DIR, "profiles.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readProfiles(): Profile[] {
  ensureDataDir();
  if (!fs.existsSync(PROFILES_FILE)) return [];
  return JSON.parse(fs.readFileSync(PROFILES_FILE, "utf-8"));
}

function writeProfiles(profiles: Profile[]) {
  ensureDataDir();
  fs.writeFileSync(PROFILES_FILE, JSON.stringify(profiles, null, 2));
}

export async function getProfile(email: string): Promise<Profile | null> {
  const kv = getKV();

  if (kv) {
    return (await kv.get<Profile>(`${KEY_PREFIX}${email}`)) || null;
  }

  const profiles = readProfiles();
  return profiles.find((p) => p.email === email) || null;
}

export async function saveProfile(
  email: string,
  data: Omit<Profile, "email">
): Promise<Profile> {
  const kv = getKV();
  const profile: Profile = { ...data, email };

  if (kv) {
    await kv.set(`${KEY_PREFIX}${email}`, profile);
    return profile;
  }

  // File fallback for local development
  const profiles = readProfiles();
  const idx = profiles.findIndex((p) => p.email === email);
  if (idx >= 0) {
    profiles[idx] = profile;
  } else {
    profiles.push(profile);
  }
  writeProfiles(profiles);
  return profile;
}

export async function hasProfile(email: string): Promise<boolean> {
  const profile = await getProfile(email);
  return profile !== null;
}
