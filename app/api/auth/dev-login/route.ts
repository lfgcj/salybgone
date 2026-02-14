import { NextResponse } from "next/server";
import { addSubscriber } from "@/lib/subscribers";
import { createSession } from "@/lib/auth";

const SESSION_COOKIE = "salybgone_session";
const SESSION_DURATION_DAYS = 30;
const DEV_EMAIL = "dev@salybgone.local";
const DEV_CUSTOMER_ID = "cus_dev_local";
const DEV_SUBSCRIPTION_ID = "sub_dev_local";

export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  // Seed a test subscriber
  await addSubscriber(DEV_EMAIL, DEV_CUSTOMER_ID, DEV_SUBSCRIPTION_ID);

  // Create a session JWT
  const token = await createSession(DEV_EMAIL, DEV_CUSTOMER_ID);

  const response = NextResponse.json({
    message: "Dev session created",
    email: DEV_EMAIL,
  });

  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: false,
    sameSite: "strict",
    maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
    path: "/",
  });

  return response;
}
