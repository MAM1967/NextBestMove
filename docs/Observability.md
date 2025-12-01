# Observability

This document provides an overview of the observability tools used in NextBestMove.

## Current Setup

NextBestMove uses two open-source observability tools:

1. **GlitchTip** - Error tracking and monitoring
2. **Umami** - Privacy-focused analytics

Both tools are free, open-source, and privacy-compliant.

## Documentation

- **[GlitchTip Setup Guide](./GlitchTip_Setup_Guide.md)** - Complete guide for setting up error tracking
- **[Umami Setup Guide](./Umami_Setup_Guide.md)** - Complete guide for setting up analytics
- **[Finding Umami Website ID](./Umami_Finding_Website_ID.md)** - Quick reference for finding your Umami Website ID

## Quick Reference

### Environment Variables

**GlitchTip (Error Tracking):**
```bash
NEXT_PUBLIC_GLITCHTIP_DSN=https://your-project@glitchtip.com/project-id
```

**Umami (Analytics):**
```bash
NEXT_PUBLIC_UMAMI_URL=https://your-umami-instance.com
NEXT_PUBLIC_UMAMI_WEBSITE_ID=your-website-id-here
```

### Implementation

- **Error Tracking**: Uses `@sentry/nextjs` SDK (Sentry-compatible) with GlitchTip DSN
- **Analytics**: Uses Umami tracking script embedded in `layout.tsx`
- **Logging**: Centralized logger utility in `web/src/lib/utils/logger.ts`

## Status

✅ **GlitchTip**: Configured and active  
✅ **Umami**: Configured and active  
✅ **Logger**: Integrated with GlitchTip for automatic error reporting

---

_For historical context, see [Archive/Observability/](./Archive/Observability/)_

