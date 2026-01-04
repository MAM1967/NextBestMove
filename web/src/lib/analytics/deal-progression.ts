import type { SupabaseClient } from "@supabase/supabase-js";

export type DealStage =
  | "prospecting"
  | "qualifying"
  | "proposal"
  | "negotiation"
  | "closed_won"
  | "closed_lost";

export interface DealProgressionMetrics {
  totalDeals: number;
  byStage: Record<DealStage, number>;
  conversionRates: Record<string, number>; // e.g., "prospecting->qualifying": 0.75
  averageTimeInStage: Record<DealStage, number>; // days
  totalValue: number;
  averageDealValue: number;
  winRate: number; // closed_won / (closed_won + closed_lost)
}

/**
 * Calculate deal progression metrics for a user.
 */
export async function calculateDealProgression(
  supabase: SupabaseClient,
  userId: string,
  startDate?: string,
  endDate?: string
): Promise<DealProgressionMetrics> {
  // Build query for actions with deal stages
  let query = supabase
    .from("actions")
    .select("id, deal_stage, deal_value, created_at, updated_at, completed_at")
    .eq("user_id", userId)
    .not("deal_stage", "is", null);

  if (startDate) {
    query = query.gte("created_at", startDate);
  }
  if (endDate) {
    query = query.lte("created_at", endDate);
  }

  const { data: actions, error } = await query;

  if (error) {
    console.error("Error fetching deal progression data:", error);
    return getEmptyMetrics();
  }

  if (!actions || actions.length === 0) {
    return getEmptyMetrics();
  }

  // Calculate metrics
  const byStage: Record<DealStage, number> = {
    prospecting: 0,
    qualifying: 0,
    proposal: 0,
    negotiation: 0,
    closed_won: 0,
    closed_lost: 0,
  };

  let totalValue = 0;
  const stageTransitions: Array<{
    from: DealStage;
    to: DealStage;
    days: number;
  }> = [];

  actions.forEach((action) => {
    const stage = action.deal_stage as DealStage;
    if (stage && stage in byStage) {
      byStage[stage]++;
    }

    if (action.deal_value) {
      totalValue += Number(action.deal_value);
    }
  });

  // Calculate conversion rates (simplified - would need action history for accurate tracking)
  const conversionRates: Record<string, number> = {};
  const stageOrder: DealStage[] = [
    "prospecting",
    "qualifying",
    "proposal",
    "negotiation",
    "closed_won",
  ];

  for (let i = 0; i < stageOrder.length - 1; i++) {
    const fromStage = stageOrder[i];
    const toStage = stageOrder[i + 1];
    const fromCount = byStage[fromStage];
    const toCount = byStage[toStage];

    if (fromCount > 0) {
      conversionRates[`${fromStage}->${toStage}`] = toCount / fromCount;
    }
  }

  // Calculate average time in stage (simplified - would need historical data)
  const averageTimeInStage: Record<DealStage, number> = {
    prospecting: 0,
    qualifying: 0,
    proposal: 0,
    negotiation: 0,
    closed_won: 0,
    closed_lost: 0,
  };

  // Calculate win rate
  const closedWon = byStage.closed_won;
  const closedLost = byStage.closed_lost;
  const winRate =
    closedWon + closedLost > 0 ? closedWon / (closedWon + closedLost) : 0;

  // Calculate average deal value
  const dealsWithValue = actions.filter((a) => a.deal_value).length;
  const averageDealValue = dealsWithValue > 0 ? totalValue / dealsWithValue : 0;

  return {
    totalDeals: actions.length,
    byStage,
    conversionRates,
    averageTimeInStage,
    totalValue,
    averageDealValue,
    winRate,
  };
}

function getEmptyMetrics(): DealProgressionMetrics {
  return {
    totalDeals: 0,
    byStage: {
      prospecting: 0,
      qualifying: 0,
      proposal: 0,
      negotiation: 0,
      closed_won: 0,
      closed_lost: 0,
    },
    conversionRates: {},
    averageTimeInStage: {
      prospecting: 0,
      qualifying: 0,
      proposal: 0,
      negotiation: 0,
      closed_won: 0,
      closed_lost: 0,
    },
    totalValue: 0,
    averageDealValue: 0,
    winRate: 0,
  };
}

