import fs from "fs";
import path from "path";
import { getKV } from "./kv";
import type { Comment, CommentWithTool } from "./types";

const KEY_COMMENTS = "comments:";
const KEY_INDEX = "comments-index:";
const KEY_RECENT = "comments-recent";
const MAX_RECENT = 50;

// Rate limiting
const COMMENT_RATE_LIMIT_MAX = 10;
const COMMENT_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// File-based fallback for local development
const DATA_DIR = path.join(process.cwd(), "data");
const COMMENTS_FILE = path.join(DATA_DIR, "comments.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

interface CommentsStore {
  [toolSlug: string]: Comment[];
}

function readCommentsFile(): CommentsStore {
  ensureDataDir();
  if (!fs.existsSync(COMMENTS_FILE)) return {};
  return JSON.parse(fs.readFileSync(COMMENTS_FILE, "utf-8"));
}

function writeCommentsFile(store: CommentsStore) {
  ensureDataDir();
  fs.writeFileSync(COMMENTS_FILE, JSON.stringify(store, null, 2));
}

export async function getComments(toolSlug: string): Promise<Comment[]> {
  const kv = getKV();

  if (kv) {
    const comments = await kv.get<Comment[]>(`${KEY_COMMENTS}${toolSlug}`);
    return comments || [];
  }

  const store = readCommentsFile();
  return store[toolSlug] || [];
}

export async function addComment(
  toolSlug: string,
  comment: Comment
): Promise<Comment> {
  const kv = getKV();

  if (kv) {
    // Append to tool's comment list
    const existing = await kv.get<Comment[]>(`${KEY_COMMENTS}${toolSlug}`);
    const comments = existing ? [...existing, comment] : [comment];
    await kv.set(`${KEY_COMMENTS}${toolSlug}`, comments);

    // Update count index
    await kv.set(`${KEY_INDEX}${toolSlug}`, comments.length);

    // Update recent comments (keep last 50)
    const recent =
      (await kv.get<CommentWithTool[]>(KEY_RECENT)) || [];
    recent.push({ ...comment, toolSlug });
    if (recent.length > MAX_RECENT) recent.shift();
    await kv.set(KEY_RECENT, recent);

    return comment;
  }

  // File fallback
  const store = readCommentsFile();
  if (!store[toolSlug]) store[toolSlug] = [];
  store[toolSlug].push(comment);
  writeCommentsFile(store);
  return comment;
}

export async function getCommentCount(toolSlug: string): Promise<number> {
  const kv = getKV();

  if (kv) {
    const count = await kv.get<number>(`${KEY_INDEX}${toolSlug}`);
    return count || 0;
  }

  const store = readCommentsFile();
  return (store[toolSlug] || []).length;
}

export async function getCommentCounts(
  toolSlugs: string[]
): Promise<Record<string, number>> {
  const kv = getKV();
  const counts: Record<string, number> = {};

  if (kv) {
    const results = await Promise.all(
      toolSlugs.map((slug) => kv.get<number>(`${KEY_INDEX}${slug}`))
    );
    toolSlugs.forEach((slug, i) => {
      counts[slug] = results[i] || 0;
    });
    return counts;
  }

  const store = readCommentsFile();
  for (const slug of toolSlugs) {
    counts[slug] = (store[slug] || []).length;
  }
  return counts;
}

export async function getRecentComments(
  limit = 50
): Promise<CommentWithTool[]> {
  const kv = getKV();

  if (kv) {
    const recent =
      (await kv.get<CommentWithTool[]>(KEY_RECENT)) || [];
    return recent.slice(-limit);
  }

  // File fallback — flatten all comments with tool slug, sort by date, take last N
  const store = readCommentsFile();
  const all: CommentWithTool[] = [];
  for (const [toolSlug, comments] of Object.entries(store)) {
    for (const c of comments) {
      all.push({ ...c, toolSlug });
    }
  }
  all.sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  return all.slice(-limit);
}

export async function checkCommentRateLimit(
  email: string
): Promise<boolean> {
  const kv = getKV();
  const key = `comment-ratelimit:${email}`;

  if (kv) {
    const timestamps = await kv.get<number[]>(key);
    if (!timestamps) return true;
    const now = Date.now();
    const recent = timestamps.filter(
      (ts) => now - ts < COMMENT_RATE_LIMIT_WINDOW_MS
    );
    return recent.length < COMMENT_RATE_LIMIT_MAX;
  }

  // File fallback — skip rate limiting in local dev
  return true;
}

export async function recordCommentRateLimit(
  email: string
): Promise<void> {
  const kv = getKV();
  const key = `comment-ratelimit:${email}`;

  if (kv) {
    const now = Date.now();
    const existing = await kv.get<number[]>(key);
    const timestamps = existing
      ? existing
          .filter((ts) => now - ts < COMMENT_RATE_LIMIT_WINDOW_MS)
          .concat(now)
      : [now];
    const ttlSeconds = Math.ceil(COMMENT_RATE_LIMIT_WINDOW_MS / 1000);
    await kv.set(key, timestamps, { ex: ttlSeconds });
  }
}
