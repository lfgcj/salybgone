import { NextRequest, NextResponse } from "next/server";
import { getSession, createSession } from "@/lib/auth";
import { getProfile, saveProfile } from "@/lib/profiles";
import type { Profile } from "@/lib/types";

const SESSION_COOKIE = "salybgone_session";
const SESSION_DURATION_DAYS = 30;

const VALID_ROLES = [
  "CPA",
  "Partner",
  "Senior Associate",
  "Staff Accountant",
  "Controller",
  "Bookkeeper",
  "CFO",
  "IT/Technology",
  "Other",
];

const VALID_FIRM_SIZES = [
  "Solo practitioner",
  "2-5",
  "6-15",
  "16-50",
  "51-200",
  "200+",
];

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getProfile(session.email);
  return NextResponse.json({ profile });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Validate required fields
  const { fullName, company, role, firmSize } = body;
  if (!fullName?.trim() || !company?.trim()) {
    return NextResponse.json(
      { error: "Full name and company are required" },
      { status: 400 }
    );
  }
  if (!VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }
  if (!VALID_FIRM_SIZES.includes(firmSize)) {
    return NextResponse.json({ error: "Invalid firm size" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const existing = await getProfile(session.email);

  const profileData: Omit<Profile, "email"> = {
    fullName: fullName.trim(),
    company: company.trim(),
    role,
    firmSize,
    city: (body.city || "").trim(),
    state: (body.state || "").trim(),
    industries: Array.isArray(body.industries) ? body.industries : [],
    engagementTypes: Array.isArray(body.engagementTypes)
      ? body.engagementTypes
      : [],
    biggestPainPoint: body.biggestPainPoint || "",
    referralSource: body.referralSource || "",
    toolInterests: (body.toolInterests || "").trim(),
    completedAt: existing?.completedAt || now,
    updatedAt: now,
  };

  await saveProfile(session.email, profileData);

  // Reissue session JWT with hasProfile: true
  const newToken = await createSession(
    session.email,
    session.stripeCustomerId,
    true
  );

  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE, newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
    path: "/",
  });

  return response;
}
