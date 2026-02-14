import { NextRequest, NextResponse } from "next/server";
import {
  createMagicLinkToken,
  checkRateLimit,
  recordRateLimitHit,
} from "@/lib/auth";
import { getSubscriber } from "@/lib/subscribers";
import { sendMagicLinkEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (!checkRateLimit(normalizedEmail)) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        { status: 429 }
      );
    }

    recordRateLimitHit(normalizedEmail);

    const subscriber = await getSubscriber(normalizedEmail);
    if (!subscriber) {
      // Don't reveal whether the email exists
      return NextResponse.json({
        message: "If an account exists, a login link has been sent.",
      });
    }

    if (subscriber.status !== "active") {
      return NextResponse.json({
        message: "If an account exists, a login link has been sent.",
        redirect: "/expired",
      });
    }

    const token = createMagicLinkToken(normalizedEmail);
    const result = await sendMagicLinkEmail(normalizedEmail, token);

    if (!result.success) {
      console.error("Failed to send magic link:", result.error);
      return NextResponse.json(
        { error: "Failed to send login email. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "If an account exists, a login link has been sent.",
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
