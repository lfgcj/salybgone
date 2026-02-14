"use client";

import { useEffect, useState } from "react";
import type { Tool } from "@/lib/types";

export default function DashboardPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tools")
      .then((r) => r.json())
      .then((data) => {
        setTools(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
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
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      // Handle error
    }
  };

  const handleLogout = async () => {
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
              onChange={(e) => setSearch(e.target.value)}
              className="input-field"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
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
                  <span className="text-xs text-text-muted">
                    Added {tool.dateAdded}
                  </span>
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
