import { NextRequest, NextResponse } from "next/server";
import { verifyMagicLinkToken, createSession } from "@/lib/auth";
import { getSubscriber } from "@/lib/subscribers";
import { getStripe } from "@/lib/stripe";
import { addSubscriber } from "@/lib/subscribers";
import { hasProfile } from "@/lib/profiles";
import { cookies } from "next/headers";

const SESSION_COOKIE = "salybgone_session";
const SESSION_DURATION_DAYS = 30;

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

  // Handle Stripe Checkout success redirect
  const checkoutSessionId = request.nextUrl.searchParams.get(
    "checkout_session"
  );
  if (checkoutSessionId) {
    return handleCheckoutSuccess(checkoutSessionId, baseUrl);
  }

  // Handle magic link verification
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(`${baseUrl}/login?error=missing_token`);
  }

  const result = await verifyMagicLinkToken(token);
  if (!result.valid) {
    return NextResponse.redirect(
      `${baseUrl}/login?error=${encodeURIComponent(result.error)}`
    );
  }

  const subscriber = await getSubscriber(result.email);
  if (!subscriber) {
    return NextResponse.redirect(`${baseUrl}/login?error=no_subscription`);
  }

  if (subscriber.status !== "active") {
    return NextResponse.redirect(`${baseUrl}/expired`);
  }

  const profileExists = await hasProfile(subscriber.email);
  const sessionToken = await createSession(
    subscriber.email,
    subscriber.stripeCustomerId,
    profileExists
  );

  const redirectTo = profileExists ? "/dashboard" : "/onboarding";
  const response = NextResponse.redirect(`${baseUrl}${redirectTo}`);
  response.cookies.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
    path: "/",
  });

  return response;
}

async function handleCheckoutSuccess(
  sessionId: string,
  baseUrl: string
): Promise<NextResponse> {
  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    const email =
      session.customer_email || session.customer_details?.email;
    const customerId = session.customer as string;
    const subscriptionId = session.subscription as string;

    if (!email || !customerId) {
      return NextResponse.redirect(`${baseUrl}/login?error=checkout_failed`);
    }

    // Ensure subscriber exists (webhook may not have fired yet)
    if (subscriptionId) {
      await addSubscriber(email, customerId, subscriptionId);
    }

    // New subscribers won't have a profile yet — hasProfile: false
    const sessionToken = await createSession(email, customerId, false);

    const response = NextResponse.redirect(`${baseUrl}/onboarding`);
    response.cookies.set(SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Checkout success handling error:", error);
    return NextResponse.redirect(`${baseUrl}/login?error=checkout_failed`);
  }
}

export async function POST() {
  // Logout
  const cookieStore = cookies();
  cookieStore.delete(SESSION_COOKIE);
  return NextResponse.json({ success: true });
}
