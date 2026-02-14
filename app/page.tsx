"use client";

import { useEffect, useState, useRef } from "react";
import type { Tool } from "@/lib/types";

function useIntersectionObserver(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
}

function AnimatedSection({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, isVisible } = useIntersectionObserver();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-8"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function LandingPage() {
  const [tools, setTools] = useState<Tool[]>([]);

  useEffect(() => {
    fetch("/api/tools")
      .then((r) => r.json())
      .then(setTools)
      .catch(() => {});
  }, []);

  const handleSubscribe = async () => {
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      // Handle error silently
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="font-mono text-lg font-semibold text-amber">
            SalyBGone
          </span>
          <nav className="flex items-center gap-6">
            <a
              href="/login"
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Log in
            </a>
            <button onClick={handleSubscribe} className="btn-primary text-sm">
              Get Access
            </button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20">
        <AnimatedSection>
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
              <span className="font-mono text-amber">SalyBGone</span>
              <span className="text-text-primary">.com</span>
            </h1>
            <p className="text-xl md:text-2xl text-text-secondary leading-relaxed mb-4">
              Automation tools built by an auditor who gets it.
            </p>
            <p className="text-lg text-text-muted leading-relaxed mb-10">
              Stop wasting hours on repetitive tasks. Download scripts, macros,
              and templates that actually work for accounting workflows.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={handleSubscribe} className="btn-primary text-base">
                Get Access — $100/month
              </button>
              <a href="#tools" className="btn-secondary text-base text-center">
                See the Tools
              </a>
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* Value Props */}
      <section className="border-y border-border bg-bg-card">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "100% Local Processing",
                desc: "Every tool runs on your machine. Your client data never leaves your computer.",
              },
              {
                title: "New Tools Monthly",
                desc: "Fresh automation tools added regularly, built from real audit and accounting workflows.",
              },
              {
                title: "Built for Accountants",
                desc: "No generic software. Every tool solves a specific problem auditors and accountants actually have.",
              },
            ].map((prop, i) => (
              <AnimatedSection key={prop.title} delay={i * 150}>
                <div className="space-y-3">
                  <div className="w-1 h-8 bg-amber rounded-full" />
                  <h3 className="text-lg font-semibold text-text-primary">
                    {prop.title}
                  </h3>
                  <p className="text-text-secondary leading-relaxed">
                    {prop.desc}
                  </p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <AnimatedSection>
          <h2 className="text-3xl font-bold text-text-primary mb-12">
            How It Works
          </h2>
        </AnimatedSection>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: "01",
              title: "Subscribe",
              desc: "One flat rate. Access every tool in the library.",
            },
            {
              step: "02",
              title: "Browse Tools",
              desc: "Find what you need by category, tags, or search.",
            },
            {
              step: "03",
              title: "Download & Run",
              desc: "Download the zip, follow the instructions, save hours.",
            },
          ].map((item, i) => (
            <AnimatedSection key={item.step} delay={i * 150}>
              <div className="card group">
                <span className="font-mono text-amber text-sm font-medium">
                  {item.step}
                </span>
                <h3 className="text-xl font-semibold text-text-primary mt-3 mb-2">
                  {item.title}
                </h3>
                <p className="text-text-secondary">{item.desc}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* Tool Preview Grid */}
      <section id="tools" className="border-y border-border bg-bg-card">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <AnimatedSection>
            <h2 className="text-3xl font-bold text-text-primary mb-2">
              Tool Library
            </h2>
            <p className="text-text-secondary mb-12">
              A growing collection of automation tools for auditors and accountants.
            </p>
          </AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((tool, i) => (
              <AnimatedSection key={tool.slug} delay={i * 100}>
                <div className="bg-bg border border-border rounded-xl p-6 hover:border-border-hover transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <span className="badge text-xs">{tool.category}</span>
                    <svg
                      className="w-4 h-4 text-text-muted"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <h3 className="font-mono text-sm font-medium text-text-primary mb-2">
                    {tool.name}
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed mb-4">
                    {tool.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {tool.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="badge-neutral text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-text-muted mt-4">
                    Subscribe to access
                  </p>
                </div>
              </AnimatedSection>
            ))}
          </div>

          {tools.length === 0 && (
            <AnimatedSection>
              <div className="text-center py-12 text-text-muted">
                <p>Tools are being loaded into the registry.</p>
              </div>
            </AnimatedSection>
          )}

          <AnimatedSection>
            <div className="mt-12 text-center">
              <button onClick={handleSubscribe} className="btn-primary">
                Get Access — $100/month
              </button>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Trust / About */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <AnimatedSection>
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-12 h-1 bg-amber mx-auto mb-8 rounded-full" />
            <p className="text-xl text-text-primary leading-relaxed mb-4">
              &ldquo;I built these tools because I was tired of doing the same
              tedious work every engagement. Now my team uses them daily.&rdquo;
            </p>
            <p className="text-text-secondary">
              <span className="font-semibold text-text-primary">
                Chris Johnson
              </span>
              <br />
              15+ years automating what others do manually
            </p>
          </div>
        </AnimatedSection>
      </section>

      {/* Final CTA */}
      <section className="border-y border-border bg-bg-card">
        <div className="max-w-6xl mx-auto px-6 py-16 text-center">
          <AnimatedSection>
            <h2 className="text-3xl font-bold text-text-primary mb-4">
              Ready to save hours every week?
            </h2>
            <p className="text-text-secondary mb-8 max-w-xl mx-auto">
              Join accounting firms that have already automated their most tedious
              workflows.
            </p>
            <button onClick={handleSubscribe} className="btn-primary text-base">
              Get Access — $100/month
            </button>
          </AnimatedSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="font-mono text-sm text-amber">SalyBGone</span>
            <div className="flex items-center gap-6 text-sm text-text-muted">
              <a
                href="/login"
                className="hover:text-text-secondary transition-colors"
              >
                Log in
              </a>
              <a
                href="mailto:chris@salybgone.com"
                className="hover:text-text-secondary transition-colors"
              >
                Contact
              </a>
            </div>
            <p className="text-xs text-text-muted">
              Built with &#9824; in San Antonio, TX
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
