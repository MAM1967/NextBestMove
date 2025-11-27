export type CapacityInfo = {
  level: "micro" | "light" | "standard" | "heavy" | "default";
  actionsPerDay: number;
  source: "fallback" | "calendar";
};

export async function getCapacityForDate(
  userId: string,
  date: string
): Promise<CapacityInfo> {
  void userId;
  void date;
  // TODO: Replace with real free/busy calculation once calendar sync ships.
  return {
    level: "default",
    actionsPerDay: 6,
    source: "fallback",
  };
}

