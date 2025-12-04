# Company Research & Enrichment for Pre-Call Briefs

## Overview

Enhance pre-call briefs with automated company research to provide users with context about new leads/pins before calls. This feature automatically gathers company information similar to what a junior analyst would prepare for their boss.

## Problem Statement

Many pins are new leads without rich interaction history. Users need context about:
- The company they're calling
- Recent news/press releases (last 3 months)
- Financial information (if public company - latest 10Q)
- Basic company information (industry, size, website)

## Feature Scope

### Data Sources

1. **Company Identification**
   - Extract company domain from email address (e.g., `john@acmecorp.com` → `acmecorp.com`)
   - Extract company from LinkedIn profile URL (if available)
   - Use company website to identify company name

2. **Company Information**
   - Company name, industry, size (employee count)
   - Company website
   - Location/headquarters
   - **Source:** LinkedIn Company API, Clearbit, or similar enrichment service

3. **Recent News & Press Releases**
   - News articles mentioning company (last 3 months)
   - Press releases (last 3 months)
   - **Source:** News API, Google News API, or company website RSS feed

4. **Financial Information (Public Companies Only)**
   - Latest 10Q filing (quarterly report)
   - Key financial metrics (revenue, growth, etc.)
   - **Source:** SEC EDGAR API

### Implementation Approach

#### Phase 1: Basic Company Enrichment (MVP)

**Data Sources:**
- Email domain → Company website lookup
- Company website → Basic company info (name, industry)
- **APIs to consider:**
  - Clearbit Enrichment API (company data from domain)
  - LinkedIn Company API (if available)
  - Company website scraping (fallback)

**Storage:**
- Add `company_enrichment` table to store cached company data
- Cache for 7 days (company info doesn't change frequently)
- Link to `person_pins` via `person_pin_id`

**Display in Pre-Call Brief:**
- Add "Company Overview" section to brief
- Show: Company name, industry, size, website
- Only for Premium users (Standard users see teaser)

#### Phase 2: News & Press Releases

**Data Sources:**
- Google News API (free tier: 100 requests/day)
- NewsAPI.org (free tier: 100 requests/day)
- Company website RSS feed (if available)

**Storage:**
- Add `company_news` table
- Store: title, source, date, URL, snippet
- Cache for 1 day (news is time-sensitive)
- Link to `company_enrichment` via `company_id`

**Display in Pre-Call Brief:**
- Add "Recent News" section (last 3 months)
- Show: Top 3-5 most relevant articles
- Include: Title, source, date, link
- Only for Premium users

#### Phase 3: SEC Filings (Public Companies)

**Data Sources:**
- SEC EDGAR API (free, public data)
- Identify public companies via ticker symbol lookup
- Fetch latest 10Q filing

**Storage:**
- Add `company_filings` table
- Store: filing type, date, URL, key metrics (extracted)
- Cache for 30 days (quarterly filings)
- Link to `company_enrichment` via `company_id`

**Display in Pre-Call Brief:**
- Add "Financial Overview" section (if public company)
- Show: Latest 10Q date, key metrics, link to filing
- Only for Premium users

## Database Schema

```sql
-- Company enrichment table
CREATE TABLE company_enrichment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_pin_id UUID REFERENCES person_pins(id) ON DELETE CASCADE,
  company_domain TEXT NOT NULL,
  company_name TEXT,
  company_website TEXT,
  industry TEXT,
  employee_count_range TEXT, -- e.g., "51-200", "201-500"
  headquarters_location TEXT,
  is_public BOOLEAN DEFAULT false,
  ticker_symbol TEXT, -- If public company
  enriched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '7 days',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(person_pin_id)
);

CREATE INDEX idx_company_enrichment_domain ON company_enrichment(company_domain);
CREATE INDEX idx_company_enrichment_expires ON company_enrichment(expires_at);

-- Company news table
CREATE TABLE company_news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_enrichment_id UUID REFERENCES company_enrichment(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  source TEXT NOT NULL,
  published_date DATE NOT NULL,
  url TEXT NOT NULL,
  snippet TEXT,
  relevance_score NUMERIC, -- 0-1, for ranking
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(company_enrichment_id, url) -- Prevent duplicates
);

CREATE INDEX idx_company_news_enrichment ON company_news(company_enrichment_id);
CREATE INDEX idx_company_news_date ON company_news(published_date DESC);

-- Company filings table (for public companies)
CREATE TABLE company_filings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_enrichment_id UUID REFERENCES company_enrichment(id) ON DELETE CASCADE,
  filing_type TEXT NOT NULL, -- '10Q', '10K', etc.
  filing_date DATE NOT NULL,
  period_end_date DATE,
  sec_url TEXT NOT NULL,
  key_metrics JSONB, -- Store extracted metrics like revenue, growth, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(company_enrichment_id, filing_type, filing_date)
);

CREATE INDEX idx_company_filings_enrichment ON company_filings(company_enrichment_id);
CREATE INDEX idx_company_filings_date ON company_filings(filing_date DESC);
```

## API Design

### Endpoint: `POST /api/company-enrichment/enrich`

**Request:**
```json
{
  "personPinId": "uuid",
  "email": "john@acmecorp.com", // Optional, for domain extraction
  "linkedInUrl": "https://linkedin.com/in/john-doe" // Optional
}
```

**Response:**
```json
{
  "success": true,
  "enrichment": {
    "companyName": "Acme Corp",
    "industry": "Software",
    "employeeCount": "51-200",
    "website": "https://acmecorp.com",
    "isPublic": false,
    "news": [
      {
        "title": "Acme Corp Raises $10M Series A",
        "source": "TechCrunch",
        "date": "2025-01-15",
        "url": "https://..."
      }
    ],
    "latestFiling": null // or 10Q data if public
  }
}
```

### Background Job: `GET /api/company-enrichment/refresh`

- Refresh expired enrichments
- Update news (daily)
- Update filings (monthly for public companies)

## Integration Points

### Pre-Call Brief Generation

Update `generatePreCallBrief` function to:
1. Check if person pin has company enrichment
2. If not, trigger enrichment (async, don't block brief generation)
3. Include company info in brief content for Premium users
4. Show teaser for Standard users

### Enrichment Service

Create `web/src/lib/company-enrichment/` directory:
- `enrichment.ts` - Main enrichment logic
- `sources/clearbit.ts` - Clearbit API integration
- `sources/news.ts` - News API integration
- `sources/sec.ts` - SEC EDGAR API integration
- `extractors/domain.ts` - Extract domain from email/URL
- `extractors/company.ts` - Extract company name from various sources

## Premium Feature Gating

- **Standard users:** See teaser: "Company research available - Upgrade to Premium"
- **Premium users:** See full company overview, news, and filings

## Cost Considerations

### API Costs (Estimated)

1. **Clearbit Enrichment API**
   - Free tier: 25 requests/month
   - Paid: $99/month for 1,000 requests
   - **Alternative:** Use free tier + fallback to manual lookup

2. **News API**
   - NewsAPI.org: Free tier 100 requests/day
   - Google News API: Free (with rate limits)
   - **Cost:** Minimal if using free tiers

3. **SEC EDGAR API**
   - Free, public data
   - **Cost:** $0

### Caching Strategy

- Cache company enrichment for 7 days
- Cache news for 1 day
- Cache filings for 30 days
- Reduces API calls significantly

## Implementation Priority

**Recommended:** Add to Phase 4 (Content Engine) or enhance Phase 2 (Pre-Call Briefs)

**Why:**
- High value for new leads (addresses the "no history" problem)
- Differentiates Premium plan
- Creates clear upgrade incentive
- Can be built incrementally (Phase 1 → Phase 2 → Phase 3)

## User Experience

### Pre-Call Brief with Company Research

```
📞 Upcoming Call: Product Demo with Acme Corp
Time: 2:00 PM
with: John Doe

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ personName: "John Doe",
  briefContent: `
## Company Overview
**Acme Corp** | Software | 51-200 employees
Website: acmecorp.com

## Recent News (Last 3 Months)
• Acme Corp Raises $10M Series A (TechCrunch, Jan 15)
• Acme Corp Launches New Product Line (Company Blog, Dec 20)
• Acme Corp Expands to European Markets (TechCrunch, Nov 10)

## Financial Overview (Public Company)
Latest 10Q: Q3 2024 (filed Oct 15, 2024)
Revenue: $25M (up 30% YoY)
[View Full Filing](SEC link)

## Interaction History
Last contact: 5 days ago
Total actions: 3 | Replies received: 1

## Suggested Talking Points
- Reference their recent funding round
- Ask about European expansion
- Mention their strong Q3 growth
  `,
  ...
}
```

## Next Steps

1. **Research API options** and free tier limits
2. **Design database schema** (see above)
3. **Create enrichment service** architecture
4. **Build Phase 1** (basic company info)
5. **Test with real data** and measure API costs
6. **Add Phase 2** (news) if Phase 1 successful
7. **Add Phase 3** (SEC filings) if Phase 2 successful

## Open Questions

1. **Which enrichment API?** Clearbit, FullContact, or manual lookup?
2. **Rate limiting strategy?** Per-user limits or global pool?
3. **Fallback strategy?** What if enrichment fails?
4. **Cost management?** Should we limit enrichment to Premium users only?
5. **Manual override?** Allow users to manually add company info?

