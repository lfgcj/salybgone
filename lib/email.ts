import { Resend } from "resend";

let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY is not set");
    _resend = new Resend(key);
  }
  return _resend;
}

export async function sendMagicLinkEmail(
  email: string,
  token: string
): Promise<{ success: boolean; error?: string }> {
  const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
  const magicLink = `${baseUrl}/api/auth/verify?token=${token}`;

  try {
    await getResend().emails.send({
      from: "SalyBGone <noreply@salybgone.com>",
      to: email,
      subject: "Your SalyBGone Login Link",
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="color: #F59E0B; font-size: 24px; margin-bottom: 8px;">SalyBGone</h1>
          <p style="color: #666; font-size: 14px; margin-bottom: 32px;">Automation tools for auditors & accountants</p>

          <p style="color: #333; font-size: 16px; line-height: 1.5;">
            Click the button below to log in to your SalyBGone account. This link expires in 15 minutes.
          </p>

          <a href="${magicLink}"
             style="display: inline-block; background: #F59E0B; color: #000;
                    font-weight: 600; padding: 14px 28px; border-radius: 8px;
                    text-decoration: none; margin: 24px 0; font-size: 16px;">
            Log in to SalyBGone
          </a>

          <p style="color: #999; font-size: 13px; margin-top: 32px;">
            If you didn't request this link, you can safely ignore this email.
          </p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />

          <p style="color: #999; font-size: 12px;">
            SalyBGone.com — Built by Chris Johnson
          </p>
        </div>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to send magic link email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
}
