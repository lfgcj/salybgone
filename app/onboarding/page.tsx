"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  identifyUser,
  trackOnboardingStarted,
  trackOnboardingCompleted,
} from "@/lib/analytics";

const ROLES = [
  "CPA",
  "Partner",
  "Senior Associate",
  "Staff Accountant",
  "Controller",
  "Bookkeeper",
  "CFO",
  "IT/Technology",
  "Other",
];

const FIRM_SIZES = [
  "Solo practitioner",
  "2-5",
  "6-15",
  "16-50",
  "51-200",
  "200+",
];

const INDUSTRIES = [
  "Construction",
  "Manufacturing",
  "Nonprofit",
  "Real Estate",
  "Healthcare",
  "Restaurant/Hospitality",
  "Professional Services",
  "Technology",
  "Retail",
  "Government",
  "Other",
];

const ENGAGEMENT_TYPES = [
  "Audit",
  "Review",
  "Compilation",
  "Tax",
  "Advisory",
  "401k/EBP Audit",
  "Bookkeeping",
  "Forensic",
  "Other",
];

const PAIN_POINTS = [
  "",
  "Data entry & manual processes",
  "Workpaper preparation",
  "Client communication",
  "Staff training",
  "Engagement management",
  "Compliance tracking",
  "Other",
];

const REFERRAL_SOURCES = [
  "",
  "LinkedIn",
  "Word of mouth",
  "Conference/Event",
  "Google search",
  "Podcast",
  "Other CPA",
  "Other",
];

const US_STATES = [
  "", "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC",
];

interface ProfileForm {
  fullName: string;
  company: string;
  role: string;
  firmSize: string;
  city: string;
  state: string;
  industries: string[];
  engagementTypes: string[];
  biggestPainPoint: string;
  referralSource: string;
  toolInterests: string;
}

const INITIAL_FORM: ProfileForm = {
  fullName: "",
  company: "",
  role: "",
  firmSize: "",
  city: "",
  state: "",
  industries: [],
  engagementTypes: [],
  biggestPainPoint: "",
  referralSource: "",
  toolInterests: "",
};

export default function OnboardingPage() {
  const router = useRouter();
  const [form, setForm] = useState<ProfileForm>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    trackOnboardingStarted();

    // Load existing profile if editing
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.profile) {
          setIsEditing(true);
          setForm({
            fullName: data.profile.fullName || "",
            company: data.profile.company || "",
            role: data.profile.role || "",
            firmSize: data.profile.firmSize || "",
            city: data.profile.city || "",
            state: data.profile.state || "",
            industries: data.profile.industries || [],
            engagementTypes: data.profile.engagementTypes || [],
            biggestPainPoint: data.profile.biggestPainPoint || "",
            referralSource: data.profile.referralSource || "",
            toolInterests: data.profile.toolInterests || "",
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const toggleArrayField = (
    field: "industries" | "engagementTypes",
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }));
  };

  const isValid =
    form.fullName.trim() &&
    form.company.trim() &&
    form.role &&
    form.firmSize;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong");
        setSubmitting(false);
        return;
      }

      trackOnboardingCompleted(
        form.role,
        form.firmSize,
        form.industries,
        form.referralSource
      );

      // Fetch session to get email for identify
      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json();
      if (meData.user?.email) {
        identifyUser(meData.user.email, {
          full_name: form.fullName,
          company: form.company,
          role: form.role,
          firm_size: form.firmSize,
          city: form.city,
          state: form.state,
        });
      }

      router.push("/dashboard?welcome=true");
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="font-mono text-text-muted">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="font-mono text-lg font-semibold text-amber">
            SalyBGone
          </span>
          {isEditing && (
            <a
              href="/dashboard"
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Back to Dashboard
            </a>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="badge text-xs">
              {isEditing ? "Profile" : "Step 1 of 1 — Tell us about yourself"}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            {isEditing
              ? "Edit Your Profile"
              : "Welcome to SalyBGone!"}
          </h1>
          {!isEditing && (
            <h2 className="text-3xl font-bold text-text-primary mb-2">
              Let&apos;s get to know you.
            </h2>
          )}
          <p className="text-text-secondary">
            {isEditing
              ? "Update your information anytime."
              : "This helps us recommend the right tools and build what you need most."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Required Fields */}
          <div className="card">
            <h3 className="text-lg font-semibold text-text-primary mb-6">
              About You <span className="text-amber text-sm font-normal">*Required</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium text-text-secondary mb-2"
                >
                  Full Name <span className="text-amber">*</span>
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={form.fullName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, fullName: e.target.value }))
                  }
                  placeholder="Jane Doe"
                  required
                  className="input-field"
                />
              </div>
              <div>
                <label
                  htmlFor="company"
                  className="block text-sm font-medium text-text-secondary mb-2"
                >
                  Company / Firm Name <span className="text-amber">*</span>
                </label>
                <input
                  id="company"
                  type="text"
                  value={form.company}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, company: e.target.value }))
                  }
                  placeholder="Smith & Associates CPAs"
                  required
                  className="input-field"
                />
              </div>
              <div>
                <label
                  htmlFor="role"
                  className="block text-sm font-medium text-text-secondary mb-2"
                >
                  Role <span className="text-amber">*</span>
                </label>
                <select
                  id="role"
                  value={form.role}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, role: e.target.value }))
                  }
                  required
                  className="input-field"
                >
                  <option value="">Select your role</option>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="firmSize"
                  className="block text-sm font-medium text-text-secondary mb-2"
                >
                  Firm Size <span className="text-amber">*</span>
                </label>
                <select
                  id="firmSize"
                  value={form.firmSize}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, firmSize: e.target.value }))
                  }
                  required
                  className="input-field"
                >
                  <option value="">Select firm size</option>
                  {FIRM_SIZES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="card">
            <h3 className="text-lg font-semibold text-text-primary mb-6">
              Location
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="city"
                  className="block text-sm font-medium text-text-secondary mb-2"
                >
                  City
                </label>
                <input
                  id="city"
                  type="text"
                  value={form.city}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, city: e.target.value }))
                  }
                  placeholder="San Antonio"
                  className="input-field"
                />
              </div>
              <div>
                <label
                  htmlFor="state"
                  className="block text-sm font-medium text-text-secondary mb-2"
                >
                  State
                </label>
                <select
                  id="state"
                  value={form.state}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, state: e.target.value }))
                  }
                  className="input-field"
                >
                  <option value="">Select state</option>
                  {US_STATES.filter(Boolean).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Industries */}
          <div className="card">
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Industries You Serve
            </h3>
            <p className="text-text-muted text-sm mb-4">
              Select all that apply
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {INDUSTRIES.map((ind) => (
                <label
                  key={ind}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                    form.industries.includes(ind)
                      ? "border-amber bg-amber/10 text-amber"
                      : "border-border bg-bg-card text-text-secondary hover:border-border-hover"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={form.industries.includes(ind)}
                    onChange={() => toggleArrayField("industries", ind)}
                    className="sr-only"
                  />
                  <span className="text-sm">{ind}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Engagement Types */}
          <div className="card">
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Types of Engagements
            </h3>
            <p className="text-text-muted text-sm mb-4">
              Select all that apply
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ENGAGEMENT_TYPES.map((eng) => (
                <label
                  key={eng}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                    form.engagementTypes.includes(eng)
                      ? "border-amber bg-amber/10 text-amber"
                      : "border-border bg-bg-card text-text-secondary hover:border-border-hover"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={form.engagementTypes.includes(eng)}
                    onChange={() => toggleArrayField("engagementTypes", eng)}
                    className="sr-only"
                  />
                  <span className="text-sm">{eng}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Pain Points & Referral */}
          <div className="card">
            <h3 className="text-lg font-semibold text-text-primary mb-6">
              A Few More Things
            </h3>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="painPoint"
                  className="block text-sm font-medium text-text-secondary mb-2"
                >
                  Biggest pain point right now
                </label>
                <select
                  id="painPoint"
                  value={form.biggestPainPoint}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, biggestPainPoint: e.target.value }))
                  }
                  className="input-field"
                >
                  <option value="">Select one</option>
                  {PAIN_POINTS.filter(Boolean).map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="referral"
                  className="block text-sm font-medium text-text-secondary mb-2"
                >
                  How did you hear about SalyBGone?
                </label>
                <select
                  id="referral"
                  value={form.referralSource}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, referralSource: e.target.value }))
                  }
                  className="input-field"
                >
                  <option value="">Select one</option>
                  {REFERRAL_SOURCES.filter(Boolean).map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="toolInterests"
                  className="block text-sm font-medium text-text-secondary mb-2"
                >
                  What tools are you most excited about?
                </label>
                <textarea
                  id="toolInterests"
                  value={form.toolInterests}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, toolInterests: e.target.value }))
                  }
                  placeholder="e.g., anything that automates workpaper prep, Excel macros for bank recs..."
                  rows={3}
                  className="input-field resize-none"
                />
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!isValid || submitting}
            className="btn-primary w-full text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting
              ? "Saving..."
              : isEditing
                ? "Update Profile"
                : "Complete Setup"}
          </button>
        </form>
      </main>
    </div>
  );
}
