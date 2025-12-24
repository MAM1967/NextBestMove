"use client";

import { useEffect, useState } from "react";
import { LeadFilterToggle } from "./LeadFilterToggle";
import { LeadList } from "./LeadList";
import { AddLeadModal } from "./AddLeadModal";
import { EditLeadModal } from "./EditLeadModal";
import { SnoozeModal } from "./SnoozeModal";
import { FloatingActionButton } from "./FloatingActionButton";
import { UpgradeModal } from "../components/UpgradeModal";
import { GlobalRollup } from "./GlobalRollup";
import type { Lead, LeadFilter } from "@/lib/leads/types";

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [filter, setFilter] = useState<LeadFilter>("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSnoozeModalOpen, setIsSnoozeModalOpen] = useState(false);
  const [snoozeLeadId, setSnoozeLeadId] = useState<string | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [leadLimitInfo, setLeadLimitInfo] = useState<{
    currentCount: number;
    limit: number;
  } | null>(null);

  // Load leads
  const loadLeads = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/leads");
      if (!response.ok) {
        throw new Error("Failed to load leads");
      }
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error("Failed to parse leads response as JSON:", jsonError);
        throw new Error("Failed to load leads");
      }
      setLeads(data.leads || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load leads");
    } finally {
      setLoading(false);
    }
  };

  // Check lead limit before opening add modal
  const handleAddLeadClick = async () => {
    try {
      const response = await fetch("/api/billing/check-lead-limit");
      if (!response.ok) {
        // If check fails, still allow opening modal (graceful degradation)
        setIsAddModalOpen(true);
        return;
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error("Failed to parse lead limit response as JSON:", jsonError);
        // On error, allow opening modal (graceful degradation)
        setIsAddModalOpen(true);
        return;
      }
      if (!data.canAdd) {
        // Lead limit reached - show upgrade modal
        setLeadLimitInfo({
          currentCount: data.currentCount,
          limit: data.limit,
        });
        setIsUpgradeModalOpen(true);
      } else {
        // Can add lead - open add modal
        setIsAddModalOpen(true);
      }
    } catch (err) {
      console.error("Error checking lead limit:", err);
      // On error, allow opening modal (graceful degradation)
      setIsAddModalOpen(true);
    }
  };

  useEffect(() => {
    loadLeads();
  }, []);

  // Apply filter
  useEffect(() => {
    const filtered =
      filter === "ALL"
        ? leads
        : leads.filter((lead) => lead.status === filter);
    setFilteredLeads(filtered);
  }, [filter, leads]);

  // Handle lead creation
  const handleLeadSave = async (leadData: {
    name: string;
    url: string;
    notes?: string;
    cadence?: "frequent" | "moderate" | "infrequent" | "ad_hoc" | null;
    cadence_days?: number | null;
    tier?: "inner" | "active" | "warm" | "background" | null;
    preferred_channel?: "linkedin" | "email" | "text" | "other" | null;
  }) => {
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(leadData),
      });

      if (!response.ok) {
        let error;
        try {
          error = await response.json();
        } catch (jsonError) {
          throw new Error("Failed to create lead");
        }
        throw new Error(error.error || "Failed to create lead");
      }

      await loadLeads();
      setIsAddModalOpen(false);
    } catch (err) {
      throw err; // Let modal handle error display
    }
  };

  // Handle lead update
  const handleLeadUpdate = async (
    leadId: string,
    leadData: {
      name: string;
      url: string;
      notes?: string;
      cadence?: "frequent" | "moderate" | "infrequent" | "ad_hoc" | null;
      cadence_days?: number | null;
      tier?: "inner" | "active" | "warm" | "background" | null;
      preferred_channel?: "linkedin" | "email" | "text" | "other" | null;
    }
  ) => {
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(leadData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update lead");
      }

      await loadLeads();
      setIsEditModalOpen(false);
      setSelectedLead(null);
    } catch (err) {
      throw err; // Let modal handle error display
    }
  };

  // Handle lead status changes
  const handleLeadSnooze = async (leadId: string, snoozeUntil: string) => {
    try {
      const response = await fetch(`/api/leads/${leadId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "SNOOZED",
          snooze_until: snoozeUntil,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to snooze lead");
      }

      await loadLeads();
      setIsSnoozeModalOpen(false);
      setSnoozeLeadId(null);
    } catch (err) {
      throw err; // Let modal handle error display
    }
  };

  const handleLeadUnsnooze = async (leadId: string) => {
    try {
      const response = await fetch(`/api/leads/${leadId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "ACTIVE",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to unsnooze lead");
      }

      await loadLeads();
    } catch (err) {
      console.error("Error unsnoozing lead:", err);
    }
  };

  const handleLeadArchive = async (leadId: string) => {
    try {
      const response = await fetch(`/api/leads/${leadId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "ARCHIVED",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to archive lead");
      }

      await loadLeads();
    } catch (err) {
      console.error("Error archiving lead:", err);
    }
  };

  const handleLeadRestore = async (leadId: string) => {
    try {
      const response = await fetch(`/api/leads/${leadId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "ACTIVE",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to restore lead");
      }

      await loadLeads();
    } catch (err) {
      console.error("Error restoring lead:", err);
    }
  };

  const handleEdit = (lead: Lead) => {
    setSelectedLead(lead);
    setIsEditModalOpen(true);
  };

  const handleSnooze = (leadId: string) => {
    setSnoozeLeadId(leadId);
    setIsSnoozeModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Relationships
        </h1>
        <p className="text-sm text-zinc-600">
          People you don&apos;t want to forget. You&apos;ll see them again when
          it&apos;s time to follow up.
        </p>
      </header>

      <GlobalRollup />

      <LeadFilterToggle currentFilter={filter} onFilterChange={setFilter} />

      {loading && (
        <div className="text-center text-sm text-zinc-500">Loading relationships...</div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <LeadList
          leads={filteredLeads}
          onEdit={handleEdit}
          onSnooze={handleSnooze}
          onUnsnooze={handleLeadUnsnooze}
          onArchive={handleLeadArchive}
          onRestore={handleLeadRestore}
        />
      )}

      <FloatingActionButton
        onClick={handleAddLeadClick}
        label="Add Relationship"
      />

      <AddLeadModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleLeadSave}
      />

      <EditLeadModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedLead(null);
        }}
        lead={selectedLead}
        onSave={handleLeadUpdate}
      />

      <SnoozeModal
        isOpen={isSnoozeModalOpen}
        onClose={() => {
          setIsSnoozeModalOpen(false);
          setSnoozeLeadId(null);
        }}
        leadId={snoozeLeadId}
        onSnooze={handleLeadSnooze}
      />

      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        trigger="lead_limit"
        currentCount={leadLimitInfo?.currentCount}
        limit={leadLimitInfo?.limit}
      />
    </div>
  );
}

