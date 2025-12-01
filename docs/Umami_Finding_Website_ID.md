# Finding Your Umami Website ID

## Quick Guide

The **Website ID** is different from your Account ID. You need to create a website in Umami first, then get its ID.

## Steps to Find Website ID

### Option 1: From Umami Dashboard (Recommended)

1. **Log into Umami Cloud**: https://cloud.umami.is
2. **Go to Settings** → **Websites** (or click "Add Website" if you haven't created one)
3. **Create a Website** (if you haven't already):
   - Click "Add Website" or "+" button
   - Enter your website name (e.g., "NextBestMove")
   - Enter your domain (e.g., `nextbestmove.app`)
   - Click "Save"
4. **Get the Website ID**:
   - After creating the website, you'll see a page with tracking code
   - The tracking code will show: `<script defer src="https://cloud.umami.is/script.js" data-website-id="YOUR-WEBSITE-ID-HERE"></script>`
   - Copy the `data-website-id` value (UUID format, e.g., `ef97f9ec-8da6-4e4f-9bcf-730a9b0cb27d`)

### Option 2: From Websites List

1. Go to **Settings** → **Websites**
2. Click on your website name
3. You'll see the tracking code with the Website ID

### Option 3: Check Your Earlier Screenshot

From the image you shared earlier, I can see:

- **URL**: `https://cloud.umami.is`
- **Website ID**: `ef97f9ec-8da6-4e4f-9bcf-730a9b0cb27d`

If this matches what you see in your dashboard, use these values!

## What Each ID Is For

- **Account ID** (`a305dfee-8a86-41a1-9385-1c44f03356c3`): Your Umami account identifier
- **API Key** (`api_YuY7r0LiboTgwx7uAHkAUcLcRtHvnrx3`): For server-side API access (not needed for basic tracking)
- **Website ID** (`ef97f9ec-8da6-4e4f-9bcf-730a9b0cb27d`): Required for the tracking script (this is what you need!)

## Environment Variables Needed

For **client-side tracking** (what we're setting up), you only need:

```bash
NEXT_PUBLIC_UMAMI_URL=https://cloud.umami.is
NEXT_PUBLIC_UMAMI_WEBSITE_ID=ef97f9ec-8da6-4e4f-9bcf-730a9b0cb27d
```

The API key and account ID are **not needed** for basic page view tracking. They're only used if you want to:

- Fetch analytics data via API
- Create websites programmatically
- Access Umami data server-side

## If You Don't Have a Website Yet

1. Log into https://cloud.umami.is
2. Click "Add Website" or go to Settings → Websites
3. Fill in:
   - **Name**: NextBestMove (or any name)
   - **Domain**: `nextbestmove.app` (your production domain)
4. Click "Save"
5. Copy the Website ID from the tracking code shown

## Quick Test

Once you have the Website ID, test it:

```bash
# In your .env.local
NEXT_PUBLIC_UMAMI_URL=https://cloud.umami.is
NEXT_PUBLIC_UMAMI_WEBSITE_ID=your-actual-website-id-here
```

Then:

1. Start your dev server: `npm run dev`
2. Visit your site
3. Check Umami dashboard - you should see a page view within a few minutes
