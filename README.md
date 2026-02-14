# SalyBGone.com

Paid subscription tool hub for auditors and accountants. Built with Next.js 14, Stripe, and a file-based tool registry that lets you add new tools by dropping a folder and pushing to git.

## Architecture

```
app/                    # Next.js App Router pages and API routes
  api/
    stripe/             # Checkout, webhook, portal endpoints
    auth/               # Magic link login/verify endpoints
    download/           # Authenticated tool download endpoint
    tools/              # Public tools list endpoint
  dashboard/            # Subscriber dashboard (protected)
  tools/[slug]/         # Individual tool detail pages (protected)
  login/                # Magic link login page
  expired/              # Subscription expired page
lib/                    # Core modules
  auth.ts               # JWT sessions, magic links, rate limiting
  email.ts              # Magic link emails via Resend
  stripe.ts             # Stripe client
  subscribers.ts        # Subscriber data store (swappable)
  tools.ts              # Tool registry reader
  types.ts              # TypeScript type definitions
tools-registry/         # Drop tools here — each subfolder = one tool
scripts/
  build-registry.ts     # Compiles tools-registry into app data + zips
middleware.ts           # Route protection (JWT verification)
```

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Copy env file and fill in your values
cp .env.example .env

# 3. Build the tool registry
npm run build-registry

# 4. Start dev server
npm run dev
```

Open http://localhost:3000.

## Adding a New Tool

1. Copy `tools-registry/_TEMPLATE/` to `tools-registry/your-tool-slug/`
2. Edit `tool.json` with your tool's metadata
3. Drop your files into the folder (scripts, macros, templates, etc.)
4. Verify the build: `npm run build-registry`
5. Commit and push:
   ```bash
   git add .
   git commit -m "Add tool: your-tool-slug"
   git push
   ```
6. Vercel auto-rebuilds. The tool appears on the site.

### tool.json Schema

| Field             | Required | Description                                                |
|-------------------|----------|------------------------------------------------------------|
| `name`            | Yes      | Display name shown in the UI                               |
| `description`     | Yes      | One-line summary for the catalog                           |
| `longDescription` | No       | Detailed description for the tool detail page              |
| `category`        | Yes      | One of the valid categories (see below)                    |
| `type`            | Yes      | Always `"download"`                                        |
| `tags`            | Yes      | Array of searchable tags                                   |
| `instructions`    | Yes      | Step-by-step usage instructions                            |
| `requirements`    | No       | Software/version requirements                              |
| `dateAdded`       | Yes      | Date in YYYY-MM-DD format                                  |
| `version`         | Yes      | Semantic version string                                    |
| `files`           | Yes      | Array of filenames (must exist in the folder)              |

**Valid categories:** Audit Tools, Tax & Compliance, Excel & Spreadsheets, Data Conversion, Workflow Templates, Document Automation

## Deploy to Vercel

1. Push to GitHub
2. Import the repo in Vercel
3. Add environment variables (see below)
4. Vercel auto-detects Next.js and runs `npm run build` (which runs the registry script first)

### Connect a Custom Domain

In Vercel dashboard: Settings > Domains > Add `salybgone.com`. Update DNS records as instructed.

## Stripe Setup

1. Create a Stripe account at stripe.com
2. Create a product called "SalyBGone Pro" with a $100/month recurring price
3. Copy the price ID (starts with `price_`) to `STRIPE_PRICE_ID`
4. Copy your API keys to `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY`
5. Set up a webhook endpoint pointing to `https://salybgone.com/api/stripe/webhook`
   - Events to listen for: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
6. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`
7. Enable the Customer Portal in Stripe dashboard (Settings > Billing > Customer Portal)

## Environment Variables

| Variable                | Required | Description                              |
|-------------------------|----------|------------------------------------------|
| `STRIPE_SECRET_KEY`     | Yes      | Stripe secret API key                    |
| `STRIPE_PUBLISHABLE_KEY`| Yes      | Stripe publishable API key               |
| `STRIPE_WEBHOOK_SECRET` | Yes      | Stripe webhook signing secret            |
| `STRIPE_PRICE_ID`       | Yes      | Stripe price ID for $100/month plan      |
| `NEXTAUTH_SECRET`       | Yes      | Secret for JWT signing (min 32 chars)    |
| `NEXT_PUBLIC_URL`       | Yes      | Site URL (e.g., https://salybgone.com)   |
| `RESEND_API_KEY`        | Yes      | Resend API key for magic link emails     |

## Deployment Checklist

1. Create Stripe product and price ($100/month)
2. Set up Resend account and verify sending domain
3. Add all env vars to Vercel
4. Deploy via `git push` or Vercel CLI
5. Set up Stripe webhook endpoint
6. Enable Stripe Customer Portal
7. Connect custom domain in Vercel
8. Test the full flow with a real subscription (refund immediately)

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Auth:** Magic link emails (Resend) + JWT sessions (jose)
- **Payments:** Stripe Checkout + Customer Portal
- **Fonts:** Instrument Sans + JetBrains Mono
- **Build:** Tool registry compiled at build time via tsx script
