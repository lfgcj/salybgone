"use client";

export default function ExpiredPage() {
  const handleResubscribe = async () => {
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      // Handle error
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 rounded-full bg-amber/10 flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8 text-amber"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-text-primary mb-3">
          Subscription Ended
        </h1>
        <p className="text-text-secondary mb-8 leading-relaxed">
          Your SalyBGone subscription has expired or been cancelled. Resubscribe
          to regain access to all automation tools.
        </p>
        <button onClick={handleResubscribe} className="btn-primary">
          Resubscribe — $100/month
        </button>
        <p className="text-text-muted text-sm mt-6">
          <a
            href="mailto:chris@salybgone.com"
            className="hover:text-text-secondary transition-colors"
          >
            Need help? Contact support
          </a>
        </p>
      </div>
    </div>
  );
}
