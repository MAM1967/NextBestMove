# NextBestMove Web Application

Next.js web application for NextBestMove v0.1.

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm/pnpm/yarn
- Supabase account and project
- Google OAuth client (for calendar integration)
- Stripe account (for billing)

### Installation

1. Install dependencies:

```bash
pnpm install
# or
npm install
```

2. Copy environment variables:

```bash
cp .env.local.example .env.local
```

3. Configure environment variables in `.env.local` (see root README.md for full list)

4. Run development server:

```bash
pnpm dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## Project Structure

```
web/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Authentication pages
│   │   ├── app/               # Main application pages
│   │   ├── api/               # API routes
│   │   └── page.tsx           # Landing page
│   ├── components/            # React components
│   │   ├── ui/               # Base UI components
│   │   └── ...
│   └── lib/                  # Utilities and services
│       ├── actions/          # Action-related utilities
│       ├── billing/          # Stripe integration
│       ├── calendar/         # Calendar OAuth integration
│       ├── plans/            # Daily plan generation
│       └── ...
├── public/                    # Static assets
├── package.json
└── tsconfig.json
```

---

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm type-check` - Run TypeScript type checking
- `pnpm lint` - Run ESLint

---

## Key Technologies

- **Next.js 14+** (App Router)
- **React 18**
- **TypeScript**
- **Tailwind CSS**
- **Supabase** (Database & Auth)
- **Stripe** (Billing)

---

## Environment Variables

See root `README.md` for complete environment variable documentation.

**Required for development:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
- `CALENDAR_ENCRYPTION_KEY`

---

## Development Guidelines

### Code Style

- Use TypeScript for all new code
- Follow existing component patterns
- Use Tailwind CSS for styling
- Write self-documenting code with clear variable names

### API Routes

API routes are in `src/app/api/`. Each route should:
- Validate input (using Zod)
- Check authentication
- Handle errors gracefully
- Return appropriate HTTP status codes

### Database

- All database operations use Supabase client
- Row Level Security (RLS) policies enforce data isolation
- Use migrations for schema changes (in `supabase/migrations/`)

---

## Testing

See `docs/Testing/` for test plans and guides.

- Manual testing guides for all features
- Playwright E2E tests for critical paths
- Launch hardening test checklist

---

## Deployment

See `scripts/README_DEPLOYMENT.md` for deployment workflow.

**Deployment Process:**
1. Type check: `pnpm type-check`
2. Sync environment variables (Doppler → Vercel)
3. Push to Git (triggers Vercel deployment)

---

## Documentation

- Root `README.md` - Project overview
- `docs/Architecture/` - Technical specifications
- `docs/Planning/` - User stories and plans
- `docs/Testing/` - Test guides

---

## License

See root directory for license information.
