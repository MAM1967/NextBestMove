# Group 4.2 Phase 4: Content Engine with Voice Learning Testing Checklist

**Date:** December 2024  
**Status:** Ready for Testing  
**Feature:** Content Engine with Voice Learning - AI-generated content matching user's writing style

---

## Overview

This checklist tests the Content Engine with Voice Learning feature, which analyzes a user's writing style and generates content that matches their voice.

---

## Prerequisites

1. **Test Users:**
   - Premium user account (for feature access)
   - Standard user account (for upgrade prompt testing)
   - Premium user should have written content in the app:
     - Edited content prompts
     - Action notes
     - Pin notes
     - Manual voice samples (emails, LinkedIn posts)

2. **Test Data Requirements:**
   - At least 5 text samples (≥50 characters each) from:
     - Edited content prompts
     - Action notes
     - Pin notes
     - Manual samples (emails/LinkedIn posts)
   - OpenAI API key configured
   - Voice profile should exist (or be creatable)

3. **OpenAI Setup:**
   - `OPENAI_API_KEY` env var must be set
   - API key must have access to GPT-4 or GPT-3.5-turbo

---

## Test 1: Voice Profile Creation - Premium User

**Goal:** Verify Premium users can create a voice profile

### Setup
1. Log in as Premium user
2. Ensure user has at least 5 text samples (≥50 characters each)
3. Navigate to `/app/settings` → "Content & voice learning" section

### Test Steps
1. **Check Voice Profile Section:**
   - Should see "Voice Learning" section
   - Should show count of available text samples
   - Should show "Create Profile" button if no profile exists
   - Should show "Regenerate Profile" button if profile exists

2. **Create Voice Profile:**
   - Click "Create Profile" button
   - Should show loading state
   - Should call OpenAI API to analyze writing style
   - Should create entry in `user_voice_profiles` table
   - Should display voice characteristics:
     - Tone (e.g., "Professional-Friendly")
     - Sentence Length (e.g., "Medium")
     - Formality (e.g., "Semi-Formal")
     - Vocabulary (e.g., "Intermediate")
     - Writing Patterns (greeting, closing)
   - Should show "Updated [date]" timestamp

3. **Check Common Phrases:**
   - Should display list of common phrases/phrases
   - Should show count: "Analyzed from X text samples (≥50 characters each)"

### Expected Results
- ✅ Premium user can create voice profile
- ✅ Voice characteristics are displayed correctly
- ✅ Common phrases are extracted
- ✅ Sample count is accurate
- ✅ No errors in console

---

## Test 2: Voice Profile Creation - Insufficient Samples

**Goal:** Verify graceful handling when user has < 5 samples

### Setup
1. Log in as Premium user with < 5 text samples
2. Navigate to `/app/settings` → "Content & voice learning" section

### Test Steps
1. **Check UI:**
   - Should show count of available samples
   - Should show message: "Need at least 5 text samples. Found X."
   - "Create Profile" button should be disabled or show error

2. **Attempt to Create:**
   - Click "Create Profile" (if enabled)
   - Should show error message
   - Should not call OpenAI API
   - Should not create profile

### Expected Results
- ✅ Clear messaging about insufficient samples
- ✅ Profile creation is blocked
- ✅ No unnecessary API calls

---

## Test 3: Voice Profile - Manual Sample Addition

**Goal:** Verify users can add manual text samples

### Setup
1. Log in as Premium user
2. Navigate to `/app/settings` → "Content & voice learning" section

### Test Steps
1. **Add Email Sample:**
   - Click "Add Sample" button
   - Select "Email" type
   - Enter email text (≥50 characters)
   - Click "Save"
   - Should create entry in `manual_voice_samples` table
   - Should appear in samples list
   - Should update sample count

2. **Add LinkedIn Post Sample:**
   - Click "Add Sample" button
   - Select "LinkedIn Post" type
   - Enter post text (≥50 characters)
   - Click "Save"
   - Should create entry in `manual_voice_samples` table
   - Should appear in samples list
   - Should update sample count

3. **Check Sample Display:**
   - Should show sample type (Email/LinkedIn Post)
   - Should show date added
   - Should show preview of text
   - Should have delete button (trash icon)

4. **Delete Sample:**
   - Click delete button on a sample
   - Should confirm deletion
   - Should remove from database
   - Should update sample count
   - Should disappear from list

### Expected Results
- ✅ Users can add email samples
- ✅ Users can add LinkedIn post samples
- ✅ Samples are saved correctly
- ✅ Samples appear in list
- ✅ Samples can be deleted
- ✅ Sample count updates correctly

---

## Test 4: Voice Profile - Regeneration

**Goal:** Verify users can regenerate their voice profile

### Setup
1. Log in as Premium user with existing voice profile
2. Add more text samples (or edit existing content)
3. Navigate to `/app/settings` → "Content & voice learning" section

### Test Steps
1. **Regenerate Profile:**
   - Click "Regenerate Profile" button
   - Should show loading state
   - Should call OpenAI API with all available samples
   - Should update `user_voice_profiles` table
   - Should update voice characteristics
   - Should update "Updated [date]" timestamp
   - Should update common phrases

2. **Verify Changes:**
   - Compare old vs new characteristics
   - Should reflect new samples if added
   - Should be more accurate with more samples

### Expected Results
- ✅ Profile regeneration works
- ✅ New samples are included
- ✅ Characteristics update correctly
- ✅ Timestamp updates

---

## Test 5: Voice Profile - Standard User Upgrade Prompt

**Goal:** Verify Standard users see upgrade prompt

### Setup
1. Log in as Standard user
2. Navigate to `/app/settings` → "Content & voice learning" section

### Test Steps
1. **Check UI:**
   - Should see "Voice Learning" section
   - Should see upgrade prompt/message
   - Should NOT see "Create Profile" button (or it should be disabled)
   - Should NOT see voice profile details

2. **Check API:**
   - API `/api/voice-profile` should return 402 if accessed
   - Error code should be "UPGRADE_REQUIRED"

### Expected Results
- ✅ Standard user sees upgrade prompt
- ✅ Feature is gated behind Premium
- ✅ Clear messaging about Premium feature

---

## Test 6: Voice Profile - Sample Collection Logic

**Goal:** Verify text samples are collected correctly from all sources

### Setup
1. Log in as Premium user
2. Create content in various places:
   - Edit a content prompt
   - Add action notes
   - Add pin notes
   - Add manual samples

### Test Steps
1. **Check Sample Sources:**
   - Edited content prompts should be included
   - Action notes (≥50 chars) should be included
   - Pin notes (≥50 chars) should be included
   - Manual samples should be included

2. **Check Sample Filtering:**
   - Samples < 50 characters should be excluded
   - Only text content should be included (no HTML/markdown)
   - Duplicate samples should be handled (or allowed)

3. **Verify Count:**
   - Sample count should match actual usable samples
   - Should show: "X usable text samples available (≥50 characters each)"

### Expected Results
- ✅ All sources are collected
- ✅ Filtering works correctly (≥50 chars)
- ✅ Count is accurate
- ✅ No duplicates or invalid samples

---

## Test 7: Voice Profile - OpenAI API Integration

**Goal:** Verify OpenAI API calls work correctly

### Setup
1. Premium user with ≥5 text samples
2. `OPENAI_API_KEY` configured
3. Navigate to `/app/settings` → "Content & voice learning" section

### Test Steps
1. **Create Profile:**
   - Click "Create Profile"
   - Check network tab for OpenAI API call
   - Should use correct model (GPT-4 or GPT-3.5-turbo)
   - Should include all text samples in prompt
   - Should parse response correctly

2. **Check API Response:**
   - Should return valid JSON with voice characteristics
   - Should include tone, sentence length, formality, vocabulary
   - Should include writing patterns
   - Should include common phrases

3. **Handle API Errors:**
   - Test with invalid API key - should show error
   - Test with rate limit - should show error
   - Test with network error - should show error
   - Errors should be user-friendly

### Expected Results
- ✅ OpenAI API is called correctly
- ✅ Response is parsed correctly
- ✅ Errors are handled gracefully
- ✅ User sees helpful error messages

---

## Test 8: Voice Profile - Content Generation (Future)

**Goal:** Verify voice profile is used for content generation

### Setup
1. Premium user with voice profile
2. Navigate to content generation feature (when implemented)

### Test Steps
1. **Generate Content:**
   - Request content generation (e.g., email draft)
   - Should use voice profile characteristics
   - Generated content should match user's style:
     - Similar tone
     - Similar sentence length
     - Similar formality level
     - Uses common phrases

2. **Compare Styles:**
   - Compare generated content to user's samples
   - Should feel consistent with user's voice
   - Should not feel generic or AI-generated

### Expected Results
- ✅ Voice profile influences generation
- ✅ Generated content matches user's style
- ✅ Content feels personalized

**Note:** This test may be deferred if content generation is not yet implemented.

---

## Test 9: Voice Profile - Privacy & Data Security

**Goal:** Verify user data is handled securely

### Setup
1. Premium user with voice profile
2. Check database and API responses

### Test Steps
1. **Check Database:**
   - Voice profile stored in `user_voice_profiles` table
   - Manual samples stored in `manual_voice_samples` table
   - RLS policies should restrict access to user's own data

2. **Check API:**
   - `/api/voice-profile` should only return user's own profile
   - Should not expose other users' data
   - Should require authentication

3. **Check Privacy Statement:**
   - UI should show privacy statement
   - Should mention data usage and storage
   - Should reassure users about security

### Expected Results
- ✅ Data is stored securely
- ✅ RLS policies work correctly
- ✅ API enforces user isolation
- ✅ Privacy statement is visible

---

## Quick Test Checklist

### Voice Profile Creation
- [ ] Premium user can create profile
- [ ] Standard user sees upgrade prompt
- [ ] Profile displays characteristics correctly
- [ ] Common phrases are extracted
- [ ] Sample count is accurate

### Manual Samples
- [ ] Users can add email samples
- [ ] Users can add LinkedIn post samples
- [ ] Samples are saved correctly
- [ ] Samples can be deleted
- [ ] Sample count updates

### Profile Management
- [ ] Users can regenerate profile
- [ ] Regeneration includes new samples
- [ ] Characteristics update correctly
- [ ] Timestamp updates

### Sample Collection
- [ ] All sources are collected (prompts, notes, manual)
- [ ] Filtering works (≥50 chars)
- [ ] Count is accurate
- [ ] Insufficient samples handled gracefully

### API & Integration
- [ ] OpenAI API calls work
- [ ] API errors handled gracefully
- [ ] Data stored securely
- [ ] RLS policies work

---

## API Endpoints to Test

### Voice Profile
```
GET /api/voice-profile
```
**Premium user:** Returns voice profile  
**Standard user:** Returns 402 with `UPGRADE_REQUIRED`

```
POST /api/voice-profile/create
```
**Premium user:** Creates/regenerates profile, returns profile  
**Standard user:** Returns 402 with `UPGRADE_REQUIRED`  
**<5 samples:** Returns 400 with error message

### Manual Samples
```
GET /api/voice-profile/samples
```
**Premium user:** Returns list of manual samples

```
POST /api/voice-profile/samples
```
**Premium user:** Creates manual sample, returns sample

```
DELETE /api/voice-profile/samples/:id
```
**Premium user:** Deletes manual sample

---

## Troubleshooting

### Profile creation fails
- **Check:** User has ≥5 text samples (≥50 chars each)
- **Check:** `OPENAI_API_KEY` is set and valid
- **Check:** OpenAI API is accessible
- **Check:** Browser console for errors
- **Check:** Network tab for API call details

### Sample count incorrect
- **Check:** `countUserTextSamples` function filters by ≥50 chars
- **Check:** All sources are included (prompts, notes, manual)
- **Check:** Database queries are correct
- **Check:** Manual samples are counted

### Characteristics not displaying
- **Check:** Database has `voice_characteristics` JSONB field
- **Check:** JSON structure is correct
- **Check:** Frontend parsing logic
- **Check:** Browser console for errors

### Manual samples not saving
- **Check:** API endpoint is accessible
- **Check:** Database insert is successful
- **Check:** RLS policies allow insert
- **Check:** Sample text is ≥50 characters

### OpenAI API errors
- **Check:** API key is valid
- **Check:** API key has correct permissions
- **Check:** Rate limits not exceeded
- **Check:** Network connectivity
- **Check:** Error handling in code

---

## Test Data Setup (Optional)

If you need to create test data quickly:

```sql
-- Add manual voice samples for a Premium user
-- Replace USER_ID with actual Premium user ID

INSERT INTO manual_voice_samples (user_id, sample_type, sample_text)
VALUES
  (USER_ID, 'email', 'Hi John, I hope you are having a great week! I wanted to follow up on our conversation from last week about the project. Let me know if you have any questions.'),
  (USER_ID, 'linkedin_post', 'Excited to share some insights from my recent experience. The key to success is consistency and building systems that work for you.'),
  -- Add more samples as needed
ON CONFLICT DO NOTHING;

-- Verify sample count
SELECT COUNT(*) FROM manual_voice_samples WHERE user_id = USER_ID AND LENGTH(sample_text) >= 50;
```

---

_Last updated: December 2024_

