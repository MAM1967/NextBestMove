export type PatternType =
  | "day_of_week_performance"
  | "follow_up_timing"
  | "action_type_conversion"
  | "warm_reengagement";

export interface BasePattern<TData = unknown> {
  type: PatternType;
  data: TData;
  insight: string;
  confidence: number; // 0-1
}

export interface DayOfWeekPatternData {
  bestDays: Array<{ day: string; replyRate: number }>;
  worstDays: Array<{ day: string; replyRate: number }>;
}

export type DayOfWeekPattern = BasePattern<DayOfWeekPatternData>;

export interface FollowUpTimingBucket {
  label: string;
  hoursMin: number;
  hoursMax: number | null;
  replyRate: number;
}

export interface FollowUpTimingPatternData {
  buckets: FollowUpTimingBucket[];
}

export type FollowUpTimingPattern = BasePattern<FollowUpTimingPatternData>;

export interface ActionTypeConversionEntry {
  actionType: string;
  replyRate: number;
}

export interface ActionTypeConversionPatternData {
  entries: ActionTypeConversionEntry[];
}

export type ActionTypeConversionPattern =
  BasePattern<ActionTypeConversionPatternData>;

export interface WarmReengagementPatternData {
  reengagedCount: number;
  successRate: number;
}

export type WarmReengagementPattern =
  BasePattern<WarmReengagementPatternData>;

export type UserPattern =
  | DayOfWeekPattern
  | FollowUpTimingPattern
  | ActionTypeConversionPattern
  | WarmReengagementPattern;


