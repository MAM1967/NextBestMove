# Jira Integration Plan

**Date:** December 10, 2025  
**Status:** 📋 Planning  
**Priority:** P2 - High Priority (Phase 1)  
**Estimated Effort:** 1-2 days

---

## Overview

Integrate Jira with NextBestMove to receive bug reports and enhancement requests from users via a simple feedback form with attachment support.

---

## Goals

1. Allow users to submit bug reports and enhancement requests
2. Automatically create Jira tickets from form submissions
3. Support file attachments (screenshots, logs, etc.)
4. Provide confirmation to users
5. Track ticket creation success/failures

---

## User Flow

1. User clicks "Report Issue" or "Request Feature" link
2. Form opens with fields:
   - Type (Bug Report / Enhancement Request / Question)
   - Title
   - Description
   - Priority (optional, user-selected)
   - Attachment (optional, file upload)
   - User email (auto-filled if logged in)
3. User submits form
4. System creates Jira ticket via API
5. User sees confirmation message with ticket number

---

## Technical Implementation

### 1. Feedback Form Component

**File:** `web/src/app/feedback/page.tsx` or `/support/page.tsx`

**Fields:**
- Type: Dropdown (Bug Report, Enhancement Request, Question)
- Title: Text input (required)
- Description: Textarea (required)
- Priority: Dropdown (Low, Medium, High, Critical) - optional
- Attachment: File input (optional, max 10MB)
- Email: Text input (auto-filled if logged in, required)

**Validation:**
- Title: Required, max 200 chars
- Description: Required, max 5000 chars
- Attachment: Optional, max 10MB, image/pdf only
- Email: Required, valid email format

### 2. API Route for Jira Integration

**File:** `web/src/app/api/feedback/create-jira-ticket/route.ts`

**Functionality:**
- Receive form data + attachment
- Upload attachment to Jira (if provided)
- Create Jira issue via REST API
- Return ticket number or error

**Jira API Endpoints:**
- `POST /rest/api/3/issue` - Create issue
- `POST /rest/api/3/issue/{issueId}/attachments` - Add attachment

### 3. Jira Client Library

**File:** `web/src/lib/jira/client.ts`

**Functions:**
- `createIssue()` - Create Jira issue
- `uploadAttachment()` - Upload file attachment
- `getIssueUrl()` - Get Jira issue URL

### 4. Environment Variables

**Required:**
- `JIRA_API_TOKEN` - Jira API token
- `JIRA_BASE_URL` - Jira instance URL (e.g., `https://your-domain.atlassian.net`)
- `JIRA_PROJECT_KEY` - Project key (e.g., `NBM`)
- `JIRA_ISSUE_TYPE_BUG` - Issue type ID for bugs
- `JIRA_ISSUE_TYPE_ENHANCEMENT` - Issue type ID for enhancements
- `JIRA_ISSUE_TYPE_QUESTION` - Issue type ID for questions

---

## Jira Setup Requirements

### 1. Create API Token

1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Create API token
3. Store in Doppler (`prd` config) as `JIRA_API_TOKEN`

### 2. Configure Project

1. Create or select Jira project
2. Note project key (e.g., `NBM`)
3. Store in Doppler as `JIRA_PROJECT_KEY`

### 3. Get Issue Type IDs

1. Go to Project Settings → Issue Types
2. Note IDs for:
   - Bug
   - Enhancement/Story
   - Question/Task
3. Store in Doppler as:
   - `JIRA_ISSUE_TYPE_BUG`
   - `JIRA_ISSUE_TYPE_ENHANCEMENT`
   - `JIRA_ISSUE_TYPE_QUESTION`

### 4. Configure Fields

**Required Fields:**
- Summary (title)
- Description
- Issue Type
- Project

**Optional Fields:**
- Priority
- Labels
- Components

---

## API Implementation Details

### Jira REST API Authentication

```typescript
// Basic Auth with email + API token
const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');
headers: {
  'Authorization': `Basic ${auth}`,
  'Content-Type': 'application/json'
}
```

### Create Issue Payload

```json
{
  "fields": {
    "project": {
      "key": "NBM"
    },
    "summary": "Issue title",
    "description": {
      "type": "doc",
      "version": 1,
      "content": [
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Issue description"
            }
          ]
        }
      ]
    },
    "issuetype": {
      "id": "10001"
    },
    "priority": {
      "id": "3"
    }
  }
}
```

### Upload Attachment

```typescript
// Multipart form data
const formData = new FormData();
formData.append('file', fileBuffer, filename);

headers: {
  'Authorization': `Basic ${auth}`,
  'X-Atlassian-Token': 'no-check'
}
```

---

## Error Handling

1. **Jira API Errors:**
   - Log error details
   - Return user-friendly error message
   - Store failed submissions for retry

2. **File Upload Errors:**
   - Validate file size/type before upload
   - Handle upload failures gracefully
   - Allow submission without attachment if upload fails

3. **Network Errors:**
   - Retry logic (3 attempts)
   - Fallback: Store submission locally, retry later

---

## Security Considerations

1. **Rate Limiting:**
   - Limit submissions per user/IP
   - Prevent spam/abuse

2. **File Validation:**
   - Validate file types (images, PDFs only)
   - Scan for malicious content
   - Limit file size (10MB max)

3. **API Token Security:**
   - Store in Doppler (never commit)
   - Use environment variables
   - Rotate tokens periodically

4. **User Data:**
   - Don't expose Jira credentials to client
   - Sanitize user input
   - Log submissions for audit

---

## User Experience

### Form Design

- Clean, simple form
- Clear field labels
- Helpful placeholder text
- File upload with preview
- Loading state during submission
- Success message with ticket number
- Error message with retry option

### Confirmation

After successful submission:
- Show ticket number
- Link to Jira issue (if public)
- Email confirmation (optional)
- Clear next steps

---

## Testing Plan

1. **Unit Tests:**
   - Form validation
   - Jira API client functions
   - Error handling

2. **Integration Tests:**
   - End-to-end form submission
   - File upload
   - Jira ticket creation

3. **Manual Testing:**
   - Submit bug report
   - Submit enhancement request
   - Upload attachment
   - Test error scenarios

---

## Success Metrics

- Tickets created successfully: >95%
- Average time to create ticket: <5 seconds
- User satisfaction with feedback form
- Number of tickets created per week
- Attachment upload success rate

---

## Future Enhancements (Post-MVP)

1. **Ticket Status Updates:**
   - Webhook from Jira to update users
   - Email notifications when ticket status changes

2. **Ticket History:**
   - Show user's submitted tickets
   - Track status updates

3. **Admin Dashboard:**
   - View all tickets
   - Filter by type/status
   - Analytics

4. **Automated Responses:**
   - Auto-reply with ticket number
   - Common issue templates

---

## Dependencies

- Jira account with API access
- API token created
- Project configured
- Issue types defined
- Doppler environment variables set up

---

## Timeline

**Estimated:** 1-2 days

- **Day 1:** Form component + API route + Jira client (6-8 hours)
- **Day 2:** Testing + error handling + polish (4-6 hours)

---

**Status:** Ready for development in January 2026

