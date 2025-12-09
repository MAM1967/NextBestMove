# Legal & Compliance Review for January 1, 2026 Launch

**Status:** 🚧 In Progress  
**Last Updated:** December 9, 2025  
**Goal:** Ensure all legal and compliance requirements are met before launch

---

## Overview

This document outlines legal and compliance requirements for launching NextBestMove. Review each item and verify completion status.

---

## 1. Privacy Policy

**Status:** ✅ **CREATED AND LIVE**

**Requirement:** A privacy policy is required for:

- Collecting user data (emails, calendar data, payment information)
- Using third-party services (Supabase, Stripe, Google Calendar, OpenAI)
- Cookie usage
- Data storage and retention

**Action Items:**

- [x] Create privacy policy document ✅
- [x] Privacy policy published and live ✅
- [x] Business entity documented (MAM Growth Strategies LLC) ✅
- [ ] Verify privacy policy links in:
  - [ ] Footer of website
  - [ ] Sign-up page
  - [ ] Settings page
  - [ ] Email footers (if sending emails)

**Note:** Privacy policy exists and is live on the website. Business entity is MAM Growth Strategies LLC.

**Template Resources:**

- Use Stripe's privacy policy requirements for payment processors
- Reference Supabase privacy policy for data hosting
- Consider using a privacy policy generator or legal service

---

## 2. Terms of Service

**Status:** ✅ **CREATED AND LIVE**

**Requirement:** Terms of Service are required to:

- Define user responsibilities
- Limit liability
- Set usage rules
- Define subscription terms
- Address payment and billing terms

**Action Items:**

- [x] Create Terms of Service document ✅
- [x] Terms of Service published and live ✅
- [x] Business entity documented (MAM Growth Strategies LLC) ✅
- [ ] Verify Terms of Service links in:
  - [ ] Footer of website
  - [ ] Sign-up page (checkbox: "I agree to Terms of Service")
  - [ ] Billing/payment pages

**Note:** Terms of Service exists and is live on the website. Business entity is MAM Growth Strategies LLC.

**Key Items Addressed:**

- Subscription billing terms (monthly/annual)
- Trial period terms (14-day free trial)
- Cancellation policy
- Refund policy
- Data deletion policy

---

## 3. Cookie Policy

**Status:** ❌ **NOT CREATED**

**Requirement:** Cookie policy may be required depending on:

- Cookie usage (authentication cookies, analytics cookies)
- Jurisdiction (GDPR for EU users)
- Analytics services used

**Action Items:**

- [ ] Assess cookie usage:
  - [ ] Authentication cookies (Supabase auth cookies) - Essential
  - [ ] Analytics cookies (Umami, if used) - Optional
  - [ ] No third-party advertising cookies (confirm)
- [ ] Create cookie policy document (if required)
- [ ] Implement cookie consent banner (if using non-essential cookies)
- [ ] Link cookie policy in footer

**Note:** If only using essential cookies (authentication), a simple statement in the privacy policy may suffice.

---

## 4. GDPR Compliance (If Applicable)

**Status:** ⏭️ **NOT APPLICABLE - NOT TARGETING EU USERS**

**Requirement:** GDPR applies if you have EU users.

**Action Items:**

- [x] Determine if targeting EU users - **NOT TARGETING EU USERS** ✅
- [ ] GDPR requirements not required at launch (not targeting EU)
- [ ] Future consideration: If expanding to EU, implement:
  - [ ] Right to access (data export feature - ✅ already implemented)
  - [ ] Right to deletion (account deletion - ✅ already implemented)
  - [ ] Right to data portability (data export - ✅ already implemented)
  - [ ] Cookie consent (if using non-essential cookies)
  - [ ] Data Processing Addendum (DPA) with vendors (Supabase, Stripe)

**Current Implementation:**

- ✅ Data export feature exists (`/api/export` endpoint)
- ✅ Account deletion feature exists (Settings → Delete Account)
- ✅ Email unsubscribe functionality exists

**Note:** Not targeting EU users at launch. GDPR compliance can be addressed if/when expanding to EU market.

---

## 5. Email Compliance (CAN-SPAM Act)

**Status:** ✅ **PARTIALLY COMPLIANT**

**Requirements:**

- Clear unsubscribe mechanism
- Physical address in emails (if required)
- Accurate sender information

**Action Items:**

- [ ] Verify unsubscribe links work in all emails ✅ (Implemented)
- [ ] Add physical/business address to email footers (if required by law)
- [ ] Verify sender email addresses are accurate
- [ ] Test unsubscribe flow end-to-end

**Current Implementation:**

- ✅ Email preferences with unsubscribe in Settings
- ✅ Unsubscribe from all emails option
- ✅ Email templates via Resend

---

## 6. Payment Processing Compliance

**Status:** ✅ **COMPLIANT** (Via Stripe)

**Requirement:** Payment processing compliance handled by Stripe.

**Action Items:**

- [ ] Verify Stripe handles PCI-DSS compliance ✅ (Stripe handles this)
- [ ] Verify Stripe handles payment data securely ✅
- [ ] Ensure no payment card data stored directly ✅ (using Stripe)
- [ ] Verify Stripe Terms of Service are acceptable

**Current Implementation:**

- ✅ Using Stripe Checkout (card data never touches our servers)
- ✅ Using Stripe Customer Portal (Stripe handles all payment pages)
- ✅ No card data storage in our database

---

## 7. Data Security

**Status:** ✅ **MOSTLY COMPLIANT**

**Requirements:**

- Secure data storage
- Encryption in transit and at rest
- Access controls

**Action Items:**

- [ ] Verify data encryption:
  - [ ] HTTPS/TLS for data in transit ✅ (Vercel handles this)
  - [ ] Database encryption at rest ✅ (Supabase handles this)
  - [ ] OAuth tokens encrypted ✅ (using CALENDAR_ENCRYPTION_KEY)
- [ ] Verify access controls:
  - [ ] Row Level Security (RLS) policies ✅ (implemented)
  - [ ] API authentication ✅ (implemented)
  - [ ] Admin/service role keys secured ✅ (not in client code)

---

## 8. User Data Rights

**Status:** ✅ **IMPLEMENTED**

**Requirements:**

- Right to access data
- Right to delete data
- Right to export data

**Action Items:**

- [ ] Data export functionality ✅ (Settings → Export Data)
- [ ] Account deletion functionality ✅ (Settings → Delete Account)
- [ ] Verify both features work correctly ✅ (tested)

---

## 9. Children's Privacy (COPPA)

**Status:** ✅ **COMPLIANT** (Not targeting children)

**Requirement:** COPPA applies to services targeting children under 13.

**Action Items:**

- [ ] Confirm service is not targeting children ✅ (targeting solopreneurs/executives)
- [ ] Add age verification if needed (not required for B2B service)
- [ ] Terms of Service should state minimum age (typically 18+ for B2B)

---

## 10. Accessibility (ADA/WCAG)

**Status:** ⏭️ **DEFERRED FOR JANUARY LAUNCH**

**Requirement:** WCAG 2.1 AA compliance for accessibility.

**Action Items:**

- [ ] Accessibility audit (Area 6) - **Skipped for January launch**
- [ ] Plan for post-launch accessibility improvements
- [ ] Document known accessibility issues

**Note:** Accessibility audit was deferred to post-launch per decision on Dec 9, 2025.

---

## 11. Business Requirements

### 11.1 Business Entity

**Status:** ✅ **VERIFIED**

**Action Items:**

- [x] Verify business entity is set up ✅ **MAM Growth Strategies LLC**
- [x] Business entity documented in Privacy Policy ✅
- [x] Business entity documented in Terms of Service ✅
- [ ] Verify business address for legal documents (if needed)
- [ ] Verify business contact information (if needed)

**Note:** Business entity is MAM Growth Strategies LLC, as documented in the Privacy Policy and Terms of Service pages.

### 11.2 Tax Compliance

**Status:** ❓ **TO BE VERIFIED**

**Action Items:**

- [ ] Verify tax obligations (sales tax, etc.)
- [ ] Set up tax collection if required (Stripe Tax can help)
- [ ] Consult with tax professional

---

## Priority Items for Launch

### Must Have (Before Launch):

1. ✅ **Privacy Policy** - ✅ CREATED AND LIVE
2. ✅ **Terms of Service** - ✅ CREATED AND LIVE
3. ✅ **Email unsubscribe** - ✅ Already implemented
4. ✅ **Data export/deletion** - ✅ Already implemented
5. ✅ **Business entity verification** - ✅ MAM Growth Strategies LLC documented

### Should Have (Before Launch):

6. ⚠️ **Cookie Policy** - May be required depending on cookie usage (or statement in privacy policy)
7. ✅ **GDPR compliance** - ⏭️ NOT APPLICABLE (not targeting EU users)

### Can Defer (Post-Launch):

8. ⏭️ **Accessibility audit** - Deferred to post-launch
9. ⏭️ **Detailed GDPR implementation** - Not needed (not targeting EU)

---

## Recommendations

1. **Immediate Action:** Create Privacy Policy and Terms of Service

   - Use a template or legal service
   - Review with legal counsel if possible
   - Publish before launch

2. **GDPR Decision:** Determine if targeting EU users

   - If yes: Implement full GDPR compliance
   - If no: Can defer but plan for future expansion

3. **Cookie Usage:** Assess cookie usage
   - If only essential cookies: Statement in privacy policy may suffice
   - If using analytics cookies: Implement cookie consent

---

## Template Resources

- **Privacy Policy:**
  - Stripe's privacy policy requirements
  - Privacy policy generators (Termly, iubenda, etc.)
  - Similar SaaS products' privacy policies
- **Terms of Service:**
  - SaaS Terms of Service templates
  - Stripe's subscription terms examples
  - Similar SaaS products' terms

---

## Next Steps

1. Review this checklist
2. Determine which items are required for launch
3. Create Privacy Policy and Terms of Service
4. Publish legal pages on website
5. Add links to legal pages in appropriate locations
6. Review with legal counsel (if available)

---

**Last Updated:** December 9, 2025
