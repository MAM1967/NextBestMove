# AI Cost Analysis & BYOK Strategy

## Current AI Usage

### Content Prompt Generation
- **Frequency**: 1 call/week per user (only if ≥ 6 actions completed)
- **Model**: GPT-4o-mini (cost-efficient)
- **Tokens per call**: ~300 tokens (100 input + 200 output average)
- **Calls per month**: ~4 calls/user/month

### Weekly Summary Generation (Future)
- **Frequency**: 1 call/week per user
- **Tokens per call**: ~500 tokens
- **Calls per month**: ~4 calls/user/month

### Total Monthly Usage Per User
- **Content Prompts**: 4 calls × 300 tokens = 1,200 tokens/month
- **Weekly Summaries**: 4 calls × 500 tokens = 2,000 tokens/month
- **Total**: ~3,200 tokens/month per user

---

## Cost Analysis

### GPT-4o-mini Pricing (as of 2025)
- **Input**: $0.15 per 1M tokens
- **Output**: $0.60 per 1M tokens
- **Average mix**: ~70% input, 30% output

### Cost Per User Per Month
```
Input cost:  (3,200 × 0.7) / 1,000,000 × $0.15 = $0.00034
Output cost: (3,200 × 0.3) / 1,000,000 × $0.60 = $0.00058
Total: ~$0.00092/user/month
```

### Cost at Scale
- **100 users**: $0.09/month
- **1,000 users**: $0.92/month
- **10,000 users**: $9.20/month
- **100,000 users**: $92/month

**Conclusion**: AI costs are negligible even at scale (~$0.001/user/month).

---

## Feature Gating Strategy

### Option 1: Standard Feature (Recommended)
**Rationale**: Costs are so low that gating doesn't make economic sense. Better to include as core value.

**Implementation**:
- Content prompts included in all plans
- No throttling needed
- Differentiator: Quality and consistency, not availability

**Pros**:
- Simpler product offering
- No confusion about what's included
- Better user experience

**Cons**:
- Can't upsell on this feature
- No premium tier differentiation

---

### Option 2: Premium Feature
**Rationale**: Use as a premium differentiator even if costs are low.

**Implementation**:
- **Standard Plan**: No content prompts (or template-only, no AI)
- **Premium Plan**: AI-enhanced content prompts (2/week max)
- Could also include weekly summary AI enhancement

**Pros**:
- Clear premium value proposition
- Can justify higher pricing
- Creates upgrade incentive

**Cons**:
- More complex to explain
- Users might feel nickel-and-dimed
- Standard users get less value

---

### Option 3: Hybrid Approach
**Rationale**: Include basic version for all, enhanced for premium.

**Implementation**:
- **Standard Plan**: Template-based prompts (no AI), 1/week
- **Premium Plan**: AI-enhanced prompts, 2/week, better quality

**Pros**:
- Everyone gets value
- Premium gets clear upgrade benefit
- Cost control for standard tier

**Cons**:
- More complex implementation
- Need to maintain two code paths

---

## BYOK (Bring Your Own Key) Strategy

### Why BYOK Makes Sense

1. **Cost Control**: Power users with existing API credits can use their own
2. **Model Choice**: Users can choose better models (GPT-4, Claude) if desired
3. **Privacy**: Some users prefer their data not go through our API
4. **Enterprise**: Companies may have corporate API agreements

### Implementation Considerations

#### Where to Configure
**Recommendation: Settings Page (Not Onboarding)**

**Rationale**:
- Too technical for new users during onboarding
- Advanced users will find it when needed
- Doesn't clutter first-time experience
- Can be added later without friction

**Location**: Settings → Advanced → AI Preferences

#### Security & Storage

**Requirements**:
- Encrypt API keys at rest (use Supabase Vault or similar)
- Never log or expose keys in responses
- Validate keys before saving
- Allow users to test connection

**Database Schema Addition**:
```sql
ALTER TABLE users ADD COLUMN ai_provider TEXT; -- 'openai', 'anthropic', 'system'
ALTER TABLE users ADD COLUMN ai_api_key_encrypted TEXT; -- Encrypted key
ALTER TABLE users ADD COLUMN ai_model TEXT; -- 'gpt-4o-mini', 'gpt-4', 'claude-3-sonnet', etc.
```

#### Provider Support

**Phase 1 (MVP)**:
- OpenAI (GPT-4o-mini, GPT-4, GPT-4 Turbo)
- System default (our key)

**Phase 2**:
- Anthropic Claude (Claude 3 Sonnet, Claude 3 Opus)
- Option to use better models for premium users

#### User Experience

**Settings UI**:
```
AI Content Generation
┌─────────────────────────────────────┐
│ Use system AI (default)            │
│ ○ System API (included)            │
│ ○ Your own API key                  │
│                                     │
│ Provider: [OpenAI ▼]               │
│ API Key: [••••••••••••] [Test]    │
│ Model: [gpt-4o-mini ▼]             │
│                                     │
│ [Save Preferences]                 │
└─────────────────────────────────────┘

Benefits of using your own key:
• Use premium models (GPT-4, Claude)
• Control your API costs
• Enhanced privacy
```

#### Fallback Logic

```typescript
async function getAIClient(userId: string) {
  const user = await getUser(userId);
  
  if (user.ai_provider === 'system' || !user.ai_api_key_encrypted) {
    return getSystemOpenAIClient(); // Our key
  }
  
  // Decrypt and use user's key
  const apiKey = decrypt(user.ai_api_key_encrypted);
  return new OpenAI({ apiKey });
}
```

---

## Recommendations

### 1. Feature Gating: **Standard Feature**
- Include AI content prompts in all plans
- Costs are negligible (~$0.001/user/month)
- Better UX and simpler product

### 2. BYOK: **Settings Page (Advanced)**
- Add to Settings → Advanced section
- Support OpenAI initially, Anthropic later
- Encrypt keys, validate on save
- Fallback to system key if user key fails

### 3. Implementation Priority
- **P0**: Current implementation (system key, standard feature)
- **P1**: BYOK for OpenAI (Settings page)
- **P2**: Anthropic support
- **P3**: Premium tier differentiation (if needed)

### 4. Cost Monitoring
- Track API usage per user
- Set up alerts if costs spike unexpectedly
- Consider rate limiting if abuse detected

---

## Open Questions

1. **Pricing Strategy**: What's the target subscription price? This affects whether AI should be premium or standard.

2. **Premium Tier**: If we create a premium tier, what else should be included? (e.g., unlimited pins, advanced analytics, priority support)

3. **Model Selection**: Should standard users be able to choose models with BYOK, or is that premium-only?

4. **Usage Limits**: Should we cap AI calls per month even for standard users? (e.g., 4 calls/month = 1/week)

5. **Enterprise**: Should enterprise customers get dedicated API keys or BYOK requirement?

---

## Next Steps

1. **Decision Needed**: Standard feature or premium gating?
2. **BYOK Implementation**: Create Settings UI and backend support
3. **Cost Monitoring**: Set up usage tracking and alerts
4. **Documentation**: User guide for BYOK setup


