"use client";

import { useState } from "react";
import { DurationSelector } from "./DurationSelector";
import { BestActionCardClient } from "./BestActionCardClient";

/**
 * Client wrapper that combines DurationSelector and BestActionCardClient
 * Manages duration state and passes it to BestActionCardClient
 */
export function DurationSelectorClient() {
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-zinc-900">Best Action</h2>
        <DurationSelector
          selectedDuration={selectedDuration}
          onDurationChange={setSelectedDuration}
        />
      </div>
      <BestActionCardClient durationMinutes={selectedDuration} />
    </div>
  );
}
