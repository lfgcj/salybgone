"use client";

import { useEffect, useState } from "react";
import {
  trackCommentPosted,
  trackCommentsViewed,
} from "@/lib/analytics";

interface Comment {
  id: string;
  email: string;
  authorName: string;
  authorCompany: string;
  authorRole: string;
  content: string;
  createdAt: string;
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;

  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  const years = Math.floor(months / 12);
  return `${years}y ago`;
}

export default function CommentsSection({
  toolSlug,
  toolName,
}: {
  toolSlug: string;
  toolName: string;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/comments?tool=${encodeURIComponent(toolSlug)}`)
      .then((r) => r.json())
      .then((data) => {
        setComments(data.comments || []);
        trackCommentsViewed(toolSlug, (data.comments || []).length);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [toolSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolSlug, content: trimmed }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to post comment");
        setSubmitting(false);
        return;
      }

      // Optimistic: append the new comment
      setComments((prev) => [...prev, data.comment]);
      setContent("");
      trackCommentPosted(toolSlug, toolName, trimmed.length);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold text-text-primary mb-6">
        Comments{" "}
        {!loading && (
          <span className="text-text-muted font-normal">
            ({comments.length})
          </span>
        )}
      </h2>

      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="mb-8">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share feedback, report issues, or suggest improvements..."
          rows={3}
          maxLength={2000}
          className="input-field resize-none mb-2"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-muted">
            {content.length} / 2000
          </span>
          <button
            type="submit"
            disabled={!content.trim() || submitting}
            className="btn-primary text-sm px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Posting...
              </span>
            ) : (
              "Post Comment"
            )}
          </button>
        </div>
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      </form>

      {/* Comments List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-border rounded w-32 mb-2" />
              <div className="h-3 bg-border rounded w-full mb-1" />
              <div className="h-3 bg-border rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 border border-border border-dashed rounded-xl">
          <p className="text-text-muted text-sm">
            No comments yet. Be the first to share feedback!
          </p>
        </div>
      ) : (
        <div className="space-y-0">
          {comments.map((comment, idx) => (
            <div
              key={comment.id}
              className={`py-5 ${idx < comments.length - 1 ? "border-b border-border" : ""}`}
            >
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-sm font-semibold text-text-primary">
                  {comment.authorName}
                </span>
                {comment.authorCompany && (
                  <span className="text-xs text-text-muted">
                    {comment.authorCompany}
                  </span>
                )}
                {comment.authorRole && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white/5 text-text-secondary border border-border">
                    {comment.authorRole}
                  </span>
                )}
                <span className="text-xs text-text-muted ml-auto">
                  {relativeTime(comment.createdAt)}
                </span>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                {comment.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
