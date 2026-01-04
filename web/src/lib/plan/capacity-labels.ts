/**
 * Shared capacity labels and descriptions
 * Single source of truth for capacity level labels across the application
 */

export const capacityLabels = {
  auto: { label: "Auto", description: "Use calendar-based capacity" },
  micro: { label: "Busy Day", description: "1-2 actions" },
  light: { label: "Light Day", description: "3-4 actions" },
  standard: { label: "Standard", description: "5-6 actions" },
  heavy: { label: "Heavy Day", description: "7-8 actions" },
} as const;

/**
 * Get the display label for a capacity level
 * @param capacity - The capacity level value (micro, light, standard, heavy, default, or null)
 * @returns The display label (e.g., "Busy Day" for "micro")
 */
export function getCapacityLabel(capacity: string | null): string {
  if (!capacity || capacity === "default") {
    return capacityLabels.auto.label;
  }
  return (
    capacityLabels[capacity as keyof typeof capacityLabels]?.label ||
    capacityLabels.auto.label
  );
}

/**
 * Get the description for a capacity level
 * @param capacity - The capacity level value (micro, light, standard, heavy, default, or null)
 * @returns The description (e.g., "1-2 actions" for "micro")
 */
export function getCapacityDescription(capacity: string | null): string {
  if (!capacity || capacity === "default") {
    return capacityLabels.auto.description;
  }
  return (
    capacityLabels[capacity as keyof typeof capacityLabels]?.description ||
    capacityLabels.auto.description
  );
}

/**
 * Get both label and description for a capacity level
 * @param capacity - The capacity level value
 * @returns Object with label and description
 */
export function getCapacityInfo(capacity: string | null): {
  label: string;
  description: string;
} {
  return {
    label: getCapacityLabel(capacity),
    description: getCapacityDescription(capacity),
  };
}

