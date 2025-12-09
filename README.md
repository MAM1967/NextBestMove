# NextBestMove

> Your daily revenue rhythm — simplified.

NextBestMove gives solopreneurs and fractional executives a small set of high-leverage actions each day so they can stay consistent, follow up reliably, and book more calls without CRM overwhelm.

---

## 🚀 Quick Start

This repository contains all documentation, specifications, and code for NextBestMove v0.1.

### Environment Variables

Copy `.env.local.example` to `.env.local` and set:

**Required:**

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
- `OUTLOOK_CLIENT_ID` / `OUTLOOK_CLIENT_SECRET` / `OUTLOOK_TENANT_ID`
- `CALENDAR_ENCRYPTION_KEY` (32-byte base64 or hex string for encrypting OAuth tokens)

**Email & Notifications:**

- `RESEND_API_KEY` (for trial reminders, payment failures, win-back campaigns)

**Billing:**

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_ID_STANDARD_MONTHLY` / `STRIPE_PRICE_ID_STANDARD_YEARLY`
- `STRIPE_PRICE_ID_PREMIUM_MONTHLY` / `STRIPE_PRICE_ID_PREMIUM_YEARLY`

**Note:** Never commit `.env.local` to git. Add it to `.gitignore`.

### Repository Structure

```
NextBestMove/
├── README.md                          # This file
├── web/                               # Next.js web application
│   ├── src/
│   │   ├── app/                      # Next.js App Router
│   │   ├── components/               # React components
│   │   └── lib/                      # Utilities & services
│   └── package.json
├── supabase/                          # Supabase migrations
│   └── migrations/                   # Database migration files
├── scripts/                           # Deployment and utility scripts
├── docs/                              # Documentation
│   ├── PRD/                          # Product Requirements
│   ├── UI-UX/                        # Design specifications
│   ├── Architecture/                 # Technical specifications
│   ├── Planning/                     # User stories & planning
│   ├── Testing/                      # Test plans and guides
│   └── Troubleshooting/              # Troubleshooting guides
└── .gitignore
```

---

## 📚 Documentation

### Product Requirements

- **[PRD v0.1](docs/PRD/NextBestMove_PRD_v1.md)** - Complete product requirements document
- **[Implementation Guide](docs/Architecture/Implementation_Guide.md)** - Development roadmap

### Design & UX

- **[UI Specifications](docs/UI-UX/UI_Specifications.md)** - Complete design system
- **[Component Specifications](docs/Architecture/Component_Specifications.md)** - React component architecture
- **[Product Mockups](docs/UI-UX/Product_Screenshot_Mock_Copy_v2.md)** - Screen-by-screen mockups

### Architecture

- **[Database Schema](docs/Architecture/Database_Schema.md)** - Complete PostgreSQL schema
- **[Calendar API Specifications](docs/Architecture/Calendar_API_Specifications.md)** - Calendar integration specs
- **[Calendar Integration Summary](docs/Architecture/Calendar_Integration_Summary.md)** - Integration overview

### Planning

- **[User Stories](docs/Planning/User_Stories.md)** - Complete user stories for sprint planning
- **[Gap Analysis](docs/PRD/PRD_Mockup_Gap_Analysis.md)** - PRD vs Mockup alignment

---

## 🎯 What Is NextBestMove?

NextBestMove is an actions-first workflow app that answers the question every solo operator struggles with:

**"What should I do today to move revenue forward?"**

Instead of managing a CRM or juggling spreadsheets, you simply:

1. **Add leads** - People you don't want to lose track of
2. **Get** a short, realistic daily plan (3–8 actions), sized to your actual calendar
3. **Mark** actions as done / got reply / snooze
4. **Receive** a weekly summary with an insight and 1–2 content prompts

---

## 🔑 Core Features (v0.1)

### Actions-First Daily Plan

- A short list of high-impact actions each morning
- Automatically sized based on your calendar availability
- Includes one Fast Win to build momentum in under 5 minutes

### Leads, Not CRM Complexity

- Add simple leads (name + URL) for people you don't want to forget
- No CRM fields, no enrichment, no complexity
- Snooze leads when timing isn't right; archive when done

### Follow-Up Done Right

- One-tap "Got a reply" handling
- Smart defaults for snoozing
- Automatic next steps when the conversation heats up

### Weekly Rhythm

- Automatic weekly summary
- 2–3 sentence narrative (AI-assisted)
- Simple insight ("Your follow-ups convert best within 3 days")
- Suggested Weekly Focus for the next week
- 1–2 content prompts based on your real actions

### Calendar-Aware Capacity

- Connect your Google/Outlook calendar
- Daily plans adjust so you never feel overloaded
- If no calendar connected → fixed lightweight plan

### Billing & Subscriptions

- Stripe-powered checkout and customer portal
- Standard and Premium pricing tiers
- 14-day free trial
- Subscription status gates access to core workflows

---

## 🧱 Technology Stack

- **Frontend:** React + TypeScript, Next.js 14+ (App Router)
- **Styling:** Tailwind CSS
- **Backend:** Next.js API Routes / Node.js
- **Database:** PostgreSQL (Supabase)
- **Authentication:** Supabase Auth
- **Payments:** Stripe Checkout + Billing Portal (subscription + invoices)
- **Calendar Integration:**
  - Google Calendar API (read-only free/busy)
  - Microsoft Graph API (Outlook)
  - Direct OAuth 2.0 implementation
- **AI:** OpenAI GPT-4 for weekly summaries
- **Hosting:** Vercel + Supabase

---

## 📦 Data Model

### Core Entities

**Lead**

- name, url, notes (optional)
- status: ACTIVE | SNOOZED | ARCHIVED

**Action**

- type: OUTREACH | FOLLOW_UP | NURTURE | CALL_PREP | POST_CALL | CONTENT | FAST_WIN
- state: NEW | SENT | REPLIED | SNOOZED | DONE | ARCHIVED
- due_date, notes (optional), linked to Lead

**DailyPlan**

- date, capacity level, action list (ordered)
- Fast Win + regular actions

**WeeklySummary**

- metrics, narrative, insight, next_week_focus
- content_prompts

**Subscription**

- status: TRIALING | ACTIVE | PAST_DUE | CANCELED
- current_plan (text, e.g., SOLO)
- renewal_date, cancel_at_period_end
- stripe_customer_id / subscription_id references

See [Database Schema](docs/Architecture/Database_Schema.md) for complete schema.

---

## 🗺️ Development Roadmap

### v0.1 — MVP (Current)

- ✅ PRD completed
- ✅ UI/UX specifications
- ✅ Component architecture
- ✅ Database schema
- ✅ API specifications
- ✅ User stories
- ✅ Core features implemented
- ✅ Stripe billing integration
- ✅ Calendar integration (Google & Outlook)
- ✅ Production deployment ready
- 🚧 Launch hardening in progress

### v0.2 (Future)

- Manual "Busy / Light day" override
- "Why this action?" explanation tooltips
- Improved templates
- Cleanup mode for stale leads
- Daily email plan (opt-in)

### v1.0 (Future)

- Multi-channel actions (email / LinkedIn / DM)
- Team/assistant support
- Personalized "coaching mode" insights

---

## 📖 Documentation Quick Links

### For Product/Design

- [PRD v0.1](docs/PRD/NextBestMove_PRD_v1.md)
- [UI Specifications](docs/UI-UX/UI_Specifications.md)
- [Product Mockups](docs/UI-UX/Product_Screenshot_Mock_Copy_v2.md)

### For Developers

- [Component Specifications](docs/Architecture/Component_Specifications.md)
- [Database Schema](docs/Architecture/Database_Schema.md)
- [Calendar API Specifications](docs/Architecture/Calendar_API_Specifications.md)
- [Implementation Guide](docs/Architecture/Implementation_Guide.md)
- [Deployment Guide](scripts/README_DEPLOYMENT.md)
- [Testing Guides](docs/Testing/)

### For Planning

- [User Stories](docs/Planning/User_Stories.md)
- [Gap Analysis](docs/PRD/PRD_Mockup_Gap_Analysis.md)

---

## 🧪 Development Status

✅ **Pre-Launch Phase**

- ✅ Complete documentation and specifications
- ✅ Core features implemented and tested
- ✅ Stripe billing integration complete
- ✅ Calendar integration complete
- ✅ Launch hardening in progress
- 🎯 Target launch: January 1, 2026

---

## 🤝 Contributing

This project is currently in active development. Future roadmap may include open-source components.

---

## 📬 Contact

For collaboration inquiries: mcddsl at icloud dot com

---

## 📄 License

[Add license information here]

---

**Built for solopreneurs who value consistency over complexity.**
