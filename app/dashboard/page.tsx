"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import type { Tool } from "@/lib/types";
import {
  identifyUser,
  resetUser,
  trackSearchUsed,
  trackCategoryFiltered,
  trackBillingPortalOpened,
} from "@/lib/analytics";

function DashboardContent() {
  const searchParams = useSearchParams();
  const [showWelcome, setShowWelcome] = useState(false);
  const [tools, setTools] = useState<Tool[]>([]);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (searchParams.get("welcome") === "true") {
      setShowWelcome(true);
      // Clean up the URL
      window.history.replaceState({}, "", "/dashboard");
      const timer = setTimeout(() => setShowWelcome(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  useEffect(() => {
    fetch("/api/tools")
      .then((r) => r.json())
      .then((data: Tool[]) => {
        setTools(data);
        setLoading(false);
        // Fetch comment counts for all tools
        if (data.length > 0) {
          const slugs = data.map((t: Tool) => t.slug).join(",");
          fetch(`/api/comments?slugs=${encodeURIComponent(slugs)}`)
            .then((r) => r.json())
            .then((d) => {
              if (d.counts) setCommentCounts(d.counts);
            })
            .catch(() => {});
        }
      })
      .catch(() => setLoading(false));
  }, []);

  // Identify user in PostHog on dashboard load
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user?.email) {
          identifyUser(data.user.email, {
            stripe_customer_id: data.user.stripeCustomerId,
          });
        }
      })
      .catch(() => {});
  }, []);

  // Debounced search tracking
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();
  const trackSearch = useCallback((query: string, results: number) => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      if (query.length > 0) trackSearchUsed(query, results);
    }, 500);
  }, []);

  const categories = ["all", ...Array.from(new Set(tools.map((t) => t.category)))];

  const filtered = tools.filter((tool) => {
    const matchesSearch =
      !search ||
      tool.name.toLowerCase().includes(search.toLowerCase()) ||
      tool.description.toLowerCase().includes(search.toLowerCase()) ||
      tool.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory =
      categoryFilter === "all" || tool.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const handleManageBilling = async () => {
    trackBillingPortalOpened();
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      // Handle error
    }
  };

  const handleLogout = async () => {
    resetUser();
    await fetch("/api/auth/verify", { method: "POST" });
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/dashboard" className="font-mono text-lg font-semibold text-amber">
            SalyBGone
          </a>
          <div className="flex items-center gap-4">
            <a
              href="/onboarding"
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              My Profile
            </a>
            <button
              onClick={handleManageBilling}
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Manage Billing
            </button>
            <button
              onClick={handleLogout}
              className="text-sm text-text-muted hover:text-text-secondary transition-colors"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Welcome Toast */}
        {showWelcome && (
          <div className="mb-6 bg-amber/10 border border-amber/20 rounded-lg px-4 py-3 flex items-center justify-between">
            <p className="text-amber text-sm font-medium">
              Welcome to SalyBGone! Your profile is set up — start exploring your tools.
            </p>
            <button
              onClick={() => setShowWelcome(false)}
              className="text-amber/60 hover:text-amber ml-4"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text-primary mb-1">
            Dashboard
          </h1>
          <p className="text-text-secondary">
            Browse and download your automation tools.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search tools by name, description, or tag..."
              value={search}
              onChange={(e) => {
                const q = e.target.value;
                setSearch(q);
                trackSearch(q, filtered.length);
              }}
              className="input-field"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              trackCategoryFiltered(e.target.value);
            }}
            className="input-field sm:w-56"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === "all" ? "All Categories" : cat}
              </option>
            ))}
          </select>
        </div>

        {/* Tools Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-4 bg-border rounded w-24 mb-4" />
                <div className="h-5 bg-border rounded w-3/4 mb-3" />
                <div className="h-4 bg-border rounded w-full mb-2" />
                <div className="h-4 bg-border rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-text-muted">
              {search || categoryFilter !== "all"
                ? "No tools match your filters."
                : "No tools available yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((tool) => (
              <div
                key={tool.slug}
                className="card group flex flex-col"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="badge text-xs">{tool.category}</span>
                  <span className="text-xs text-text-muted font-mono">
                    v{tool.version}
                  </span>
                </div>
                <h3 className="font-mono text-sm font-medium text-text-primary mb-2">
                  {tool.name}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed mb-4 flex-1">
                  {tool.description}
                </p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {tool.tags.map((tag) => (
                    <span key={tag} className="badge-neutral text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-border mt-auto">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-text-muted">
                      Added {tool.dateAdded}
                    </span>
                    {(commentCounts[tool.slug] || 0) > 0 && (
                      <span className="flex items-center gap-1 text-xs text-text-muted">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        {commentCounts[tool.slug]}
                      </span>
                    )}
                  </div>
                  <a
                    href={`/tools/${tool.slug}`}
                    className="text-sm text-amber hover:text-amber-light transition-colors font-medium"
                  >
                    View Details
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-bg flex items-center justify-center">
          <div className="font-mono text-text-muted">Loading...</div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
