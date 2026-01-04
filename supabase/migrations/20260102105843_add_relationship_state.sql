-- Add relationship state machine to leads table
-- NEX-46: Relationship State Machine Implementation

-- Create relationship_state enum
CREATE TYPE relationship_state AS ENUM (
  'UNENGAGED',
  'ACTIVE_CONVERSATION',
  'OPPORTUNITY',
  'WARM_BUT_PASSIVE',
  'DORMANT'
);

-- Add relationship_state column to leads table
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS relationship_state relationship_state,
  ADD COLUMN IF NOT EXISTS state_updated_at TIMESTAMPTZ;

-- Create index for relationship_state
CREATE INDEX IF NOT EXISTS idx_leads_relationship_state ON leads(relationship_state) WHERE relationship_state IS NOT NULL;

-- Add comment
COMMENT ON COLUMN leads.relationship_state IS 'Current state in relationship lifecycle: UNENGAGED (no recent signals), ACTIVE_CONVERSATION (live back-and-forth), OPPORTUNITY (potential deal), WARM_BUT_PASSIVE (mutual awareness, no urgency), DORMANT (explicit no or long silence).';
COMMENT ON COLUMN leads.state_updated_at IS 'Timestamp when relationship_state was last updated. Used for state transition tracking.';

