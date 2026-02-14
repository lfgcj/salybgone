"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Tool } from "@/lib/types";

export default function ToolDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [tool, setTool] = useState<Tool | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetch("/api/tools")
      .then((r) => r.json())
      .then((tools: Tool[]) => {
        const found = tools.find((t) => t.slug === slug);
        setTool(found || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`/api/download/${slug}`);
      if (!res.ok) throw new Error("Download failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${slug}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      alert("Download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="font-mono text-text-muted">Loading...</div>
      </div>
    );
  }

  if (!tool) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            Tool Not Found
          </h1>
          <p className="text-text-secondary mb-6">
            This tool doesn&apos;t exist or has been removed.
          </p>
          <a href="/dashboard" className="btn-primary">
            Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <a
            href="/dashboard"
            className="font-mono text-lg font-semibold text-amber"
          >
            SalyBGone
          </a>
          <a
            href="/dashboard"
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Back to Dashboard
          </a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-text-muted mb-8">
          <a
            href="/dashboard"
            className="hover:text-text-secondary transition-colors"
          >
            Dashboard
          </a>
          <span>/</span>
          <span className="text-text-secondary">{tool.name}</span>
        </div>

        {/* Tool Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="badge">{tool.category}</span>
            <span className="text-xs text-text-muted font-mono">
              v{tool.version}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-text-primary mb-3 font-mono">
            {tool.name}
          </h1>
          <p className="text-lg text-text-secondary">{tool.description}</p>
        </div>

        {/* Action Bar */}
        <div className="card mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {tool.tags.map((tag) => (
                <span key={tag} className="badge-neutral">
                  {tag}
                </span>
              ))}
            </div>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="btn-primary whitespace-nowrap disabled:opacity-50"
            >
              {downloading ? "Downloading..." : "Download Tool"}
            </button>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Runs 100% Locally", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
            { label: "No Account Required to Run", icon: "M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" },
            { label: "Files Included in Download", icon: "M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" },
          ].map((badge) => (
            <div
              key={badge.label}
              className="flex items-center gap-3 bg-bg-card border border-border rounded-lg px-4 py-3"
            >
              <svg
                className="w-5 h-5 text-amber flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d={badge.icon}
                />
              </svg>
              <span className="text-sm text-text-secondary">{badge.label}</span>
            </div>
          ))}
        </div>

        {/* Long Description */}
        {tool.longDescription && (
          <div className="card mb-8">
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              About This Tool
            </h2>
            <div className="text-text-secondary leading-relaxed whitespace-pre-wrap">
              {tool.longDescription}
            </div>
          </div>
        )}

        {/* Requirements */}
        {tool.requirements && (
          <div className="card mb-8">
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              Requirements
            </h2>
            <p className="font-mono text-sm text-text-secondary">
              {tool.requirements}
            </p>
          </div>
        )}

        {/* Instructions */}
        {tool.instructions && (
          <div className="card mb-8">
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              Instructions
            </h2>
            <div className="text-text-secondary leading-relaxed whitespace-pre-wrap font-mono text-sm">
              {tool.instructions}
            </div>
          </div>
        )}

        {/* Files */}
        <div className="card mb-8">
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            Included Files
          </h2>
          <ul className="space-y-2">
            {tool.files.map((file) => (
              <li key={file} className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-text-muted flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span className="font-mono text-sm text-text-secondary">
                  {file}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Meta */}
        <div className="text-sm text-text-muted flex items-center gap-4">
          <span>Added {tool.dateAdded}</span>
          <span>Version {tool.version}</span>
        </div>
      </main>
    </div>
  );
}
