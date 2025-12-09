# Test Queries Directory

**Purpose:** Organized collection of reusable SQL queries for testing and staging environment setup.

**Last Updated:** December 9, 2025

---

## Directory Structure

- **Staging_Setup/** - Queries for setting up staging/test environments
- **Billing_Testing/** - Queries for testing billing and subscription functionality
- **Diagnostics/** - Diagnostic queries for troubleshooting

---

## Usage Guidelines

1. **Before using any query:**
   - Review the query to understand what it does
   - Replace placeholder values (email addresses, user IDs, etc.)
   - Verify you're running it on the correct environment (staging, not production)

2. **Query conventions:**
   - All queries use `leads` table (not `person_pins`)
   - Queries assume Supabase PostgreSQL database
   - Replace `'mcddsl@icloud.com'` or other hardcoded emails with your test user email

3. **Environment safety:**
   - Staging queries are safe to run on staging environment
   - **NEVER run these queries on production** without careful review
   - Always backup data before running UPDATE or DELETE queries

---

## Categories

### Staging Setup

Queries for creating test users, leads, actions, and setting up test scenarios.

**Files:**
- `create_test_users.sql` - Template for creating test users
- `create_test_leads.sql` - Template for creating test leads
- `create_test_actions.sql` - Template for creating test actions
- `complete_test_account_setup.sql` - Complete test account setup

### Billing Testing

Queries for testing subscription states, payment failures, trial scenarios, etc.

**Files:**
- `create_trial_users.sql` - Set up users in trial states
- `create_premium_user.sql` - Set up premium subscription users
- `test_subscription_states.sql` - Test various subscription statuses

### Diagnostics

Queries for troubleshooting and checking system state.

**Files:**
- `check_user_status.sql` - Check user account and subscription status
- `check_subscription_details.sql` - Detailed subscription information

---

## Migrated Queries

This directory contains organized versions of useful queries that were previously scattered in the root directory. One-off debugging queries have been removed.

---

**Note:** Always review queries before running them and update any hardcoded values to match your test scenario.

