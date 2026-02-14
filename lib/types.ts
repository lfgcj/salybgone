export interface Tool {
  name: string;
  slug: string;
  description: string;
  longDescription?: string;
  category: ToolCategory;
  type: "download";
  tags: string[];
  instructions: string;
  requirements?: string;
  dateAdded: string;
  version: string;
  files: string[];
}

export type ToolCategory =
  | "Audit Tools"
  | "Tax & Compliance"
  | "Excel & Spreadsheets"
  | "Data Conversion"
  | "Workflow Templates"
  | "Document Automation";

export interface Subscriber {
  email: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  status: "active" | "cancelled" | "past_due" | "paused";
  createdAt: string;
  updatedAt: string;
}

export interface MagicLinkToken {
  token: string;
  email: string;
  expiresAt: number;
  used: boolean;
}

export interface SessionPayload {
  email: string;
  stripeCustomerId: string;
  hasProfile?: boolean;
  iat: number;
  exp: number;
}

export interface Profile {
  email: string;
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
  completedAt: string;
  updatedAt: string;
}
