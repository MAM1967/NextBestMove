"use client";

import { PersonPin } from "./page";
import { PinRow } from "./PinRow";

interface PinListProps {
  pins: PersonPin[];
  onEdit: (pin: PersonPin) => void;
  onSnooze: (pinId: string) => void;
  onUnsnooze: (pinId: string) => void;
  onArchive: (pinId: string) => void;
  onRestore: (pinId: string) => void;
}

export function PinList({
  pins,
  onEdit,
  onSnooze,
  onUnsnooze,
  onArchive,
  onRestore,
}: PinListProps) {
  if (pins.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center">
        <p className="text-sm text-zinc-600">
          No pins found. Pin someone you want to follow up with.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {pins.map((pin) => (
        <PinRow
          key={pin.id}
          pin={pin}
          onEdit={onEdit}
          onSnooze={onSnooze}
          onUnsnooze={onUnsnooze}
          onArchive={onArchive}
          onRestore={onRestore}
        />
      ))}
    </div>
  );
}







