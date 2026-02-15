import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getToolBySlug } from "@/lib/tools";
import { getProfile } from "@/lib/profiles";
import {
  getComments,
  addComment,
  checkCommentRateLimit,
  recordCommentRateLimit,
  getCommentCounts,
} from "@/lib/comments";
import type { Comment } from "@/lib/types";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const toolSlug = request.nextUrl.searchParams.get("tool");

  // If no slug, return counts for all tools (used by dashboard)
  if (!toolSlug) {
    const slugs = request.nextUrl.searchParams.get("slugs");
    if (slugs) {
      const slugList = slugs.split(",").filter(Boolean);
      const counts = await getCommentCounts(slugList);
      return NextResponse.json({ counts });
    }
    return NextResponse.json({ error: "Missing tool parameter" }, { status: 400 });
  }

  const comments = await getComments(toolSlug);
  return NextResponse.json({ comments });
}

function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, "");
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { toolSlug, content } = body;

  // Validate toolSlug
  if (!toolSlug || typeof toolSlug !== "string") {
    return NextResponse.json(
      { error: "Missing tool slug" },
      { status: 400 }
    );
  }

  const tool = getToolBySlug(toolSlug);
  if (!tool) {
    return NextResponse.json(
      { error: "Tool not found" },
      { status: 400 }
    );
  }

  // Validate content
  if (!content || typeof content !== "string") {
    return NextResponse.json(
      { error: "Comment content is required" },
      { status: 400 }
    );
  }

  const sanitized = stripHtml(content).trim();
  if (sanitized.length === 0 || sanitized.length > 2000) {
    return NextResponse.json(
      { error: "Comment must be between 1 and 2000 characters" },
      { status: 400 }
    );
  }

  // Rate limit
  const allowed = await checkCommentRateLimit(session.email);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many comments. Please wait before posting again." },
      { status: 429 }
    );
  }

  // Get author info from profile
  const profile = await getProfile(session.email);

  const comment: Comment = {
    id: crypto.randomUUID(),
    email: session.email,
    authorName: profile?.fullName || session.email,
    authorCompany: profile?.company || "",
    authorRole: profile?.role || "",
    content: sanitized,
    createdAt: new Date().toISOString(),
  };

  await addComment(toolSlug, comment);
  await recordCommentRateLimit(session.email);

  return NextResponse.json({ comment });
}
