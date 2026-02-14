"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState("");
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("sending");
    setErrorMessage("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("sent");
      } else {
        setStatus("error");
        setErrorMessage(data.error || "Something went wrong");
      }
    } catch {
      setStatus("error");
      setErrorMessage("Network error. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <a href="/" className="font-mono text-2xl font-semibold text-amber">
            SalyBGone
          </a>
          <p className="text-text-secondary mt-2 text-sm">
            Log in to access your tools
          </p>
        </div>

        <div className="card">
          {urlError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-6">
              <p className="text-red-400 text-sm">
                {urlError === "missing_token"
                  ? "Invalid login link."
                  : urlError === "no_subscription"
                    ? "No active subscription found."
                    : urlError === "Token expired"
                      ? "Login link has expired. Please request a new one."
                      : urlError === "Token already used"
                        ? "Login link has already been used."
                        : "Login failed. Please try again."}
              </p>
            </div>
          )}

          {status === "sent" ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-amber/10 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-amber"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-text-primary mb-2">
                Check your email
              </h2>
              <p className="text-text-secondary text-sm">
                If an account exists for{" "}
                <span className="font-mono text-text-primary">{email}</span>,
                you&apos;ll receive a login link.
              </p>
              <p className="text-text-muted text-xs mt-4">
                The link expires in 15 minutes.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-text-secondary mb-2"
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@firm.com"
                  required
                  className="input-field"
                  disabled={status === "sending"}
                />
              </div>

              {errorMessage && (
                <p className="text-red-400 text-sm">{errorMessage}</p>
              )}

              <button
                type="submit"
                disabled={status === "sending" || !email}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === "sending" ? "Sending..." : "Send Magic Link"}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-text-muted text-xs mt-6">
          Don&apos;t have an account?{" "}
          <a href="/" className="text-amber hover:text-amber-light transition-colors">
            Subscribe here
          </a>
        </p>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-bg flex items-center justify-center">
          <div className="font-mono text-text-muted">Loading...</div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
