# NextBestMove API Documentation

**Version:** v0.1  
**Last Updated:** December 9, 2025  
**Base URL:** 
- Development: `http://localhost:3000/api`
- Production: `https://nextbestmove.app/api`

---

## Overview

This document provides a comprehensive overview of all API endpoints in the NextBestMove application. All endpoints require authentication unless otherwise noted.

**Authentication:** All endpoints (except OAuth callbacks) require a valid Supabase session cookie. The session is automatically managed by the Supabase client.

---

## Table of Contents

1. [Leads API](#leads-api)
2. [Actions API](#actions-api)
3. [Daily Plans API](#daily-plans-api)
4. [Weekly Summaries API](#weekly-summaries-api)
5. [Billing API](#billing-api)
6. [Calendar API](#calendar-api)
7. [User Management API](#user-management-api)
8. [Content Prompts API](#content-prompts-api)
9. [Cron Jobs API](#cron-jobs-api)
10. [Utility Endpoints](#utility-endpoints)

---

## Leads API

### List Leads

**Endpoint:** `GET /api/leads`

**Description:** Get all leads for the authenticated user, optionally filtered by status.

**Query Parameters:**
- `status` (optional): Filter by status (`ACTIVE`, `SNOOZED`, `ARCHIVED`)

**Response (200 OK):**
```json
{
  "leads": [
    {
      "id": "uuid",
      "name": "John Doe",
      "url": "https://linkedin.com/in/johndoe",
      "notes": "Met at conference",
      "status": "ACTIVE",
      "snooze_until": null,
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized` - Not authenticated
- `500 Internal Server Error` - Server error

---

### Create Lead

**Endpoint:** `POST /api/leads`

**Description:** Create a new lead for the authenticated user.

**Request Body:**
```json
{
  "name": "John Doe",
  "url": "https://linkedin.com/in/johndoe",
  "notes": "Optional notes"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "name": "John Doe",
  "url": "https://linkedin.com/in/johndoe",
  "notes": "Optional notes",
  "status": "ACTIVE",
  "created_at": "2025-01-01T00:00:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid input (missing name/url, invalid URL format)
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Lead limit reached (based on subscription plan)
- `500 Internal Server Error` - Server error

---

### Get Lead

**Endpoint:** `GET /api/leads/[id]`

**Description:** Get a specific lead by ID.

**Response (200 OK):**
```json
{
  "id": "uuid",
  "name": "John Doe",
  "url": "https://linkedin.com/in/johndoe",
  "notes": "Optional notes",
  "status": "ACTIVE",
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z"
}
```

**Error Responses:**
- `404 Not Found` - Lead not found or not accessible
- `401 Unauthorized` - Not authenticated

---

### Update Lead

**Endpoint:** `PUT /api/leads/[id]`

**Description:** Update an existing lead.

**Request Body:**
```json
{
  "name": "Updated Name",
  "url": "https://updated-url.com",
  "notes": "Updated notes"
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "name": "Updated Name",
  "url": "https://updated-url.com",
  "notes": "Updated notes",
  "status": "ACTIVE",
  "updated_at": "2025-01-01T00:00:00Z"
}
```

---

### Update Lead Status

**Endpoint:** `PUT /api/leads/[id]/status`

**Description:** Update the status of a lead (ACTIVE, SNOOZED, ARCHIVED).

**Request Body:**
```json
{
  "status": "SNOOZED",
  "snooze_until": "2025-01-15" // Optional, required for SNOOZED
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "status": "SNOOZED",
  "snooze_until": "2025-01-15",
  "updated_at": "2025-01-01T00:00:00Z"
}
```

---

### Delete Lead

**Endpoint:** `DELETE /api/leads/[id]`

**Description:** Delete a lead (hard delete from database).

**Response (204 No Content)**

**Error Responses:**
- `404 Not Found` - Lead not found
- `401 Unauthorized` - Not authenticated

---

## Actions API

### List Actions

**Endpoint:** `GET /api/actions`

**Description:** Get actions for the authenticated user.

**Query Parameters:**
- `state` (optional): Filter by state (`NEW`, `SENT`, `REPLIED`, `SNOOZED`, `DONE`, `ARCHIVED`)
- `due_date` (optional): Filter by due date (ISO date string)
- `person_id` (optional): Filter by lead ID
- `limit` (optional): Maximum number of actions to return

**Response (200 OK):**
```json
{
  "actions": [
    {
      "id": "uuid",
      "action_type": "OUTREACH",
      "state": "NEW",
      "description": "Reach out to John about partnership",
      "due_date": "2025-01-15",
      "notes": null,
      "person_id": "uuid",
      "auto_created": false,
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

---

### Create Action

**Endpoint:** `POST /api/actions`

**Description:** Create a new action.

**Request Body:**
```json
{
  "action_type": "FOLLOW_UP",
  "description": "Follow up on previous conversation",
  "due_date": "2025-01-15",
  "person_id": "uuid", // Optional
  "notes": "Optional notes",
  "auto_created": false
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "action_type": "FOLLOW_UP",
  "state": "NEW",
  "description": "Follow up on previous conversation",
  "due_date": "2025-01-15",
  "person_id": "uuid",
  "notes": "Optional notes",
  "auto_created": false,
  "created_at": "2025-01-01T00:00:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid input or duplicate FOLLOW_UP action for same lead
- `403 Forbidden` - Action limit reached (max 15 pending actions)

---

### Update Action

**Endpoint:** `PUT /api/actions/[id]`

**Description:** Update an existing action (due_date, notes).

**Request Body:**
```json
{
  "due_date": "2025-01-20",
  "notes": "Updated notes"
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "due_date": "2025-01-20",
  "notes": "Updated notes",
  "updated_at": "2025-01-01T00:00:00Z"
}
```

---

### Update Action State

**Endpoint:** `PUT /api/actions/[id]/state`

**Description:** Update the state of an action.

**Request Body:**
```json
{
  "state": "DONE"
}
```

---

### Snooze Action

**Endpoint:** `POST /api/actions/[id]/snooze`

**Description:** Snooze an action until a specific date.

**Request Body:**
```json
{
  "snooze_until": "2025-01-20"
}
```

---

## Daily Plans API

### Get Daily Plan

**Endpoint:** `GET /api/daily-plans`

**Description:** Get the daily plan for a specific date.

**Query Parameters:**
- `date` (required): Date in ISO format (YYYY-MM-DD)

**Response (200 OK):**
```json
{
  "date": "2025-01-15",
  "capacity": "standard",
  "free_minutes": 120,
  "focus_statement": "Focus on follow-ups this week",
  "actions": [
    {
      "id": "uuid",
      "action_type": "FAST_WIN",
      "description": "Quick win description",
      "due_date": "2025-01-15",
      "person_id": "uuid",
      "is_fast_win": true,
      "position": 0
    },
    {
      "id": "uuid",
      "action_type": "OUTREACH",
      "description": "Regular action description",
      "due_date": "2025-01-15",
      "person_id": "uuid",
      "is_fast_win": false,
      "position": 1
    }
  ]
}
```

**Response (404 Not Found):**
```json
{
  "error": "No plan found for date",
  "date": "2025-01-15"
}
```

---

### Generate Daily Plan

**Endpoint:** `POST /api/daily-plans/generate`

**Description:** Generate a new daily plan for a specific date.

**Request Body:**
```json
{
  "date": "2025-01-15"
}
```

**Response (200 OK):** Same as GET /api/daily-plans

**Error Responses:**
- `400 Bad Request` - Weekend excluded (if user preference set)
- `500 Internal Server Error` - Generation failed

---

## Weekly Summaries API

### Get Weekly Summary

**Endpoint:** `GET /api/weekly-summaries`

**Description:** Get weekly summary for a specific week.

**Query Parameters:**
- `week_start_date` (optional): Monday of the week (YYYY-MM-DD). Defaults to current week.

**Response (200 OK):**
```json
{
  "week_start_date": "2025-01-13",
  "days_active": 5,
  "actions_completed": 12,
  "replies": 3,
  "calls_booked": 1,
  "insight_text": "Your follow-ups convert best within 3 days",
  "narrative_summary": "You had a productive week...",
  "next_week_focus": "Focus on follow-ups",
  "content_prompts": [
    {
      "type": "WIN_POST",
      "content": "Content prompt text"
    }
  ]
}
```

---

## Billing API

### Start Trial

**Endpoint:** `POST /api/billing/start-trial`

**Description:** Start a 14-day free trial for the authenticated user.

**Response (200 OK):**
```json
{
  "subscription_id": "sub_xxx",
  "trial_ends_at": "2025-01-15T00:00:00Z",
  "status": "trialing"
}
```

---

### Create Checkout Session

**Endpoint:** `POST /api/billing/create-checkout-session`

**Description:** Create a Stripe checkout session for subscription.

**Request Body:**
```json
{
  "price_id": "price_xxx",
  "success_url": "https://nextbestmove.app/settings?session_id={CHECKOUT_SESSION_ID}",
  "cancel_url": "https://nextbestmove.app/settings"
}
```

**Response (200 OK):**
```json
{
  "session_id": "cs_xxx",
  "url": "https://checkout.stripe.com/..."
}
```

---

### Customer Portal

**Endpoint:** `POST /api/billing/customer-portal`

**Description:** Create a Stripe customer portal session.

**Response (200 OK):**
```json
{
  "url": "https://billing.stripe.com/..."
}
```

---

### Get Subscription

**Endpoint:** `GET /api/billing/subscription`

**Description:** Get current subscription status.

**Response (200 OK):**
```json
{
  "status": "active",
  "plan_type": "premium",
  "current_period_end": "2025-02-15T00:00:00Z",
  "cancel_at_period_end": false,
  "trial_ends_at": null
}
```

---

### Webhook

**Endpoint:** `POST /api/billing/webhook`

**Description:** Stripe webhook endpoint (handles subscription events).

**Authentication:** Stripe webhook signature verification

---

## Calendar API

See `docs/Architecture/Calendar_API_Specifications.md` for detailed calendar API documentation.

**Key Endpoints:**
- `GET /api/calendar/status` - Get connection status
- `GET /api/calendar/connect/[provider]` - Initiate OAuth (google/outlook)
- `GET /api/calendar/callback/[provider]` - OAuth callback
- `DELETE /api/calendar/disconnect` - Disconnect calendar
- `GET /api/calendar/freebusy?date=YYYY-MM-DD` - Get free/busy data

---

## User Management API

### Complete Onboarding

**Endpoint:** `PUT /api/users/complete-onboarding`

**Description:** Mark user onboarding as complete.

---

### Delete Account

**Endpoint:** `DELETE /api/users/delete-account`

**Description:** Delete user account and all associated data.

---

### Update Timezone

**Endpoint:** `PUT /api/users/timezone`

**Request Body:**
```json
{
  "timezone": "America/New_York"
}
```

---

### Update Weekend Preference

**Endpoint:** `PUT /api/users/weekend-preference`

**Request Body:**
```json
{
  "exclude_weekends": true
}
```

---

### Email Preferences

**Endpoint:** `GET /api/users/email-preferences`  
**Endpoint:** `PUT /api/users/email-preferences`

---

### Export Data

**Endpoint:** `GET /api/export`

**Description:** Export all user data (GDPR compliance).

**Response:** JSON file download with all user data

---

## Content Prompts API

### List Content Prompts

**Endpoint:** `GET /api/content-prompts`

**Query Parameters:**
- `status` (optional): Filter by status (`DRAFT`, `POSTED`, `ARCHIVED`)

---

### Update Content Prompt

**Endpoint:** `PUT /api/content-prompts/[id]`

**Request Body:**
```json
{
  "status": "POSTED"
}
```

---

## Cron Jobs API

All cron endpoints require authentication via `CRON_SECRET` header.

**Endpoints:**
- `POST /api/cron/daily-plans` - Generate daily plans
- `POST /api/cron/weekly-summaries` - Generate weekly summaries
- `POST /api/cron/auto-archive` - Archive old actions
- `POST /api/cron/auto-unsnooze` - Unsnooze overdue items
- `POST /api/cron/cleanup-stale-actions` - Archive stale auto-created actions
- `POST /api/cron/trial-reminders` - Send trial reminder emails
- `POST /api/cron/payment-failure-recovery` - Handle payment failures
- `POST /api/cron/win-back-campaign` - Win-back email campaign
- `POST /api/cron/streak-recovery` - Streak recovery emails

---

## Utility Endpoints

### Check Environment

**Endpoint:** `GET /api/check-env`

**Description:** Diagnostic endpoint to check environment variables (development only).

---

### Unsubscribe

**Endpoint:** `GET /api/unsubscribe?token=xxx`

**Description:** Unsubscribe from email notifications.

---

## Error Response Format

All error responses follow this format:

```json
{
  "error": "Error message",
  "details": "Additional error details (optional)"
}
```

**Common HTTP Status Codes:**
- `200 OK` - Success
- `201 Created` - Resource created
- `204 No Content` - Success, no response body
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized (e.g., limit reached)
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Rate Limiting

Currently, no explicit rate limiting is implemented. Consider adding rate limiting for production if needed.

---

## Authentication

All endpoints (except OAuth callbacks and public pages) require:
1. Valid Supabase session cookie
2. Authenticated user

The Supabase client automatically handles session management. For programmatic access (e.g., cron jobs), use the `CRON_SECRET` header.

---

**Last Updated:** December 9, 2025

