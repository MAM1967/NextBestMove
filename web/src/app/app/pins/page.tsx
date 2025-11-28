"use client";

import { useEffect, useState } from "react";
import { PinFilterToggle } from "./PinFilterToggle";
import { PinList } from "./PinList";
import { AddPersonModal } from "./AddPersonModal";
import { EditPersonModal } from "./EditPersonModal";
import { SnoozeModal } from "./SnoozeModal";
import { FloatingActionButton } from "./FloatingActionButton";

export type PinStatus = "ACTIVE" | "SNOOZED" | "ARCHIVED";
export type PinFilter = "ALL" | PinStatus;

export interface PersonPin {
  id: string;
  user_id: string;
  name: string;
  url: string;
  notes?: string | null;
  status: PinStatus;
  snooze_until?: string | null;
  created_at: string;
  updated_at: string;
}

export default function PinsPage() {
  const [pins, setPins] = useState<PersonPin[]>([]);
  const [filteredPins, setFilteredPins] = useState<PersonPin[]>([]);
  const [filter, setFilter] = useState<PinFilter>("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPin, setSelectedPin] = useState<PersonPin | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSnoozeModalOpen, setIsSnoozeModalOpen] = useState(false);
  const [snoozePinId, setSnoozePinId] = useState<string | null>(null);

  // Load pins
  const loadPins = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/pins");
      if (!response.ok) {
        throw new Error("Failed to load pins");
      }
      const data = await response.json();
      setPins(data.pins || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load pins");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPins();
  }, []);

  // Apply filter
  useEffect(() => {
    const filtered =
      filter === "ALL"
        ? pins
        : pins.filter((pin) => pin.status === filter);
    setFilteredPins(filtered);
  }, [filter, pins]);

  // Handle pin creation
  const handlePinSave = async (pinData: {
    name: string;
    url: string;
    notes?: string;
  }) => {
    try {
      const response = await fetch("/api/pins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pinData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create pin");
      }

      await loadPins();
      setIsAddModalOpen(false);
    } catch (err) {
      throw err; // Let modal handle error display
    }
  };

  // Handle pin update
  const handlePinUpdate = async (
    pinId: string,
    pinData: { name: string; url: string; notes?: string }
  ) => {
    try {
      const response = await fetch(`/api/pins/${pinId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pinData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update pin");
      }

      await loadPins();
      setIsEditModalOpen(false);
      setSelectedPin(null);
    } catch (err) {
      throw err; // Let modal handle error display
    }
  };

  // Handle pin status changes
  const handlePinSnooze = async (pinId: string, snoozeUntil: string) => {
    try {
      const response = await fetch(`/api/pins/${pinId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "SNOOZED",
          snooze_until: snoozeUntil,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to snooze pin");
      }

      await loadPins();
      setIsSnoozeModalOpen(false);
      setSnoozePinId(null);
    } catch (err) {
      throw err; // Let modal handle error display
    }
  };

  const handlePinUnsnooze = async (pinId: string) => {
    try {
      const response = await fetch(`/api/pins/${pinId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "ACTIVE",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to unsnooze pin");
      }

      await loadPins();
    } catch (err) {
      console.error("Error unsnoozing pin:", err);
    }
  };

  const handlePinArchive = async (pinId: string) => {
    try {
      const response = await fetch(`/api/pins/${pinId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "ARCHIVED",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to archive pin");
      }

      await loadPins();
    } catch (err) {
      console.error("Error archiving pin:", err);
    }
  };

  const handlePinRestore = async (pinId: string) => {
    try {
      const response = await fetch(`/api/pins/${pinId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "ACTIVE",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to restore pin");
      }

      await loadPins();
    } catch (err) {
      console.error("Error restoring pin:", err);
    }
  };

  const handleEdit = (pin: PersonPin) => {
    setSelectedPin(pin);
    setIsEditModalOpen(true);
  };

  const handleSnooze = (pinId: string) => {
    setSnoozePinId(pinId);
    setIsSnoozeModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Pinned People
        </h1>
        <p className="text-sm text-zinc-600">
          Names you don&apos;t want to forget. You&apos;ll see them again when
          it&apos;s time to follow up.
        </p>
      </header>

      <PinFilterToggle currentFilter={filter} onFilterChange={setFilter} />

      {loading && (
        <div className="text-center text-sm text-zinc-500">Loading pins...</div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <PinList
          pins={filteredPins}
          onEdit={handleEdit}
          onSnooze={handleSnooze}
          onUnsnooze={handlePinUnsnooze}
          onArchive={handlePinArchive}
          onRestore={handlePinRestore}
        />
      )}

      <FloatingActionButton
        onClick={() => setIsAddModalOpen(true)}
        label="Pin a Person"
      />

      <AddPersonModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handlePinSave}
      />

      <EditPersonModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedPin(null);
        }}
        pin={selectedPin}
        onSave={handlePinUpdate}
      />

      <SnoozeModal
        isOpen={isSnoozeModalOpen}
        onClose={() => {
          setIsSnoozeModalOpen(false);
          setSnoozePinId(null);
        }}
        pinId={snoozePinId}
        onSnooze={handlePinSnooze}
      />
    </div>
  );
}


