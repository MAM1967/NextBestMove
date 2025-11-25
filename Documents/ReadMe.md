NextBestMove

Your daily revenue rhythm — simplified.
NextBestMove gives solopreneurs and fractional executives a small set of high-leverage actions each day so they can stay consistent, follow up reliably, and book more calls without CRM overwhelm.

⸻

🚀 What Is NextBestMove?

NextBestMove is an actions-first workflow app that answers the question every solo operator struggles with:

“What should I do today to move revenue forward?”

Instead of managing a CRM or juggling spreadsheets, you simply:
	1.	Pin people you don’t want to lose track of
	2.	Get a short, realistic daily plan (3–8 actions), sized to your actual calendar
	3.	Mark actions as done / got reply / snooze
	4.	Receive a weekly summary with an insight and 1–2 content prompts

It’s the easiest way to stay consistent and keep your pipeline warm.

⸻

🔑 Core Features (v0.1)

Actions-First Daily Plan
	•	A short list of high-impact actions each morning
	•	Automatically sized based on your calendar availability
	•	Includes one Fast Win to build momentum in under 5 minutes

Pin, Don’t Manage
	•	Add simple “Pins” (name + URL) for people you don’t want to forget
	•	No CRM fields, no enrichment, no complexity
	•	Snooze Pins when timing isn’t right; archive when done

Follow-Up Done Right
	•	One-tap “Got a reply” handling
	•	Smart defaults for snoozing
	•	Automatic next steps when the conversation heats up

Weekly Rhythm
	•	Automatic weekly summary
	•	2–3 sentence narrative (AI-assisted)
	•	Simple insight (“Your follow-ups convert best within 3 days”)
	•	Suggested Weekly Focus for the next week
	•	1–2 content prompts based on your real actions

Calendar-Aware Capacity
	•	Connect your Google/Outlook calendar
	•	Daily plans adjust so you never feel overloaded
	•	If no calendar connected → fixed lightweight plan

⸻

💡 Why It Exists

Solopreneurs and fractional executives know the truth:

Inconsistent outreach = inconsistent revenue.
But every tool today either:
	•	Creates more admin work (CRMs)
	•	Is too generic (habit apps)
	•	Or focuses on content instead of pipeline (AI tools)

NextBestMove focuses only on the next best move — nothing more.

⸻

🎯 Target Users
	•	Fractional CMOs / CFOs / CTOs
	•	Solo consultants
	•	High-ticket freelancers
	•	Early-stage founders doing their own outbound

If your work depends on booked calls and consistent follow-ups, this app is built for you.

⸻

🧠 How It Works (Simple Version)
	1.	Pin someone
Add a name + LinkedIn URL or mailto link.
	2.	Get your plan
Based on your calendar + recent activity + follow-up needs.
	3.	Do the actions
One task at a time, with suggested scripts.
	4.	Mark outcomes
	•	Got reply
	•	No reply yet
	•	Snooze
	•	Done
	5.	Weekly reset
The app summarizes your week and proposes a clear focus for the next one.

No clutter. No CRM. No overthinking.

⸻

🧱 Architecture (High-Level)

Frontend: React + TypeScript
Backend: Next.js API routes / Node.js
Database: Postgres (Supabase recommended)
Authentication: Supabase Auth
Calendar Integration: Google Calendar API (read-only free/busy)
AI: OpenAI GPT-4 for:
	•	Weekly summary phrasing
	•	Insight phrasing
	•	Content prompt phrasing

Hosting: Vercel + Supabase

⸻

📦 Data Model (Simplified)

PersonPin
	•	name
	•	primary URL (LinkedIn/CRM/email)
	•	status: active / snoozed / archived

Action
	•	type (follow-up, outreach, nurture, etc.)
	•	state (new, sent, replied, snoozed, done)
	•	due date
	•	person reference

DailyPlan
	•	date
	•	list of action IDs
	•	focus statement

WeeklySummary
	•	metrics
	•	insight
	•	next-week focus
	•	content prompts

⸻

🔮 Roadmap

v0.1 — MVP
	•	Pin management
	•	Calendar-aware daily plan
	•	Fast Win
	•	Follow-up flow
	•	Weekly summary with AI phrasing
	•	1–2 weekly content prompts
	•	Onboarding: pin + calendar + first plan

v0.2
	•	Manual “Busy / Light day” override
	•	“Why this action?” explanation tooltips
	•	Improved templates
	•	Cleanup mode for stale Pins
	•	Daily email plan (opt-in)

v0.3
	•	Browser extension for quick pinning
	•	Gmail integration for reply detection
	•	Lightweight proposal tracking
	•	Content calendar view

v1.0
	•	Multi-channel actions (email / LI / DM)
	•	Team/assistant support
	•	Personalized “coaching mode” insights

⸻

📂 Project Structure (Proposed)

nextbestmove/
├─ src/
│  ├─ components/
│  ├─ pages/
│  ├─ api/
│  ├─ hooks/
│  ├─ lib/
│  └─ styles/
├─ prisma/ (optional)
├─ public/
├─ README.md
└─ package.json


⸻

🧪 Development Status

🚧 Early build in progress
✍️ PRD v0.1 completed
🧱 Action engine + data model ready for implementation
⚙️ Architecture decisions finalized

⸻

🤝 Contributing

This project is presently not open for external contributions.
Future roadmap may include open-source components (extension, templates, etc.)

⸻

📬 Contact

For collaboration inquiries:
(mcddsl at icloud dot com)

⸻
