import posthog from "posthog-js";

function capture(event: string, properties?: Record<string, unknown>) {
  if (typeof window !== "undefined" && posthog.__loaded) {
    posthog.capture(event, properties);
  }
}

export function trackCheckoutStarted() {
  capture("checkout_started");
}

export function trackToolViewed(slug: string, name: string) {
  capture("tool_viewed", { slug, name });
}

export function trackToolDownloaded(slug: string, name: string) {
  capture("tool_downloaded", { slug, name });
}

export function trackSearchUsed(query: string, resultCount: number) {
  capture("search_used", { query, result_count: resultCount });
}

export function trackCategoryFiltered(category: string) {
  capture("category_filtered", { category });
}

export function trackBillingPortalOpened() {
  capture("billing_portal_opened");
}

export function trackLoginCompleted(email: string) {
  capture("login_completed", { email });
}

export function identifyUser(
  email: string,
  properties?: Record<string, unknown>
) {
  if (typeof window !== "undefined" && posthog.__loaded) {
    posthog.identify(email, properties);
  }
}

export function resetUser() {
  if (typeof window !== "undefined" && posthog.__loaded) {
    posthog.reset();
  }
}

export function trackCommentPosted(
  toolSlug: string,
  toolName: string,
  commentLength: number
) {
  capture("comment_posted", {
    tool_slug: toolSlug,
    tool_name: toolName,
    comment_length: commentLength,
  });
}

export function trackCommentsViewed(toolSlug: string, commentCount: number) {
  capture("comments_viewed", {
    tool_slug: toolSlug,
    comment_count: commentCount,
  });
}

export function trackOnboardingStarted() {
  capture("onboarding_started");
}

export function trackOnboardingCompleted(
  role: string,
  firmSize: string,
  industries: string[],
  referralSource: string
) {
  capture("onboarding_completed", {
    role,
    firm_size: firmSize,
    industries,
    referral_source: referralSource,
  });
}
