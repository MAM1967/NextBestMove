"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface RelationshipWithScore {
  id: string;
  name: string;
  quadrant: "high-high" | "high-low" | "low-high" | "low-low";
  urgency: "low" | "high";
  value: "low" | "high";
  urgencyScore: number;
  valueScore: number;
  label: string;
}

interface Quadrants {
  "high-high": RelationshipWithScore[];
  "high-low": RelationshipWithScore[];
  "low-high": RelationshipWithScore[];
  "low-low": RelationshipWithScore[];
}

/**
 * UrgencyValueMatrix component
 * 
 * Displays relationships in a 2x2 matrix based on urgency and value.
 * 
 * NEX-52: Signals 2x2 Urgency/Value Matrix
 */
export function UrgencyValueMatrix() {
  const [quadrants, setQuadrants] = useState<Quadrants | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatrix = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/signals/urgency-value-matrix");
        if (!response.ok) {
          throw new Error("Failed to fetch urgency/value matrix");
        }
        const data = await response.json();
        setQuadrants(data.quadrants);
      } catch (err) {
        console.error("Error fetching urgency/value matrix:", err);
        setError(err instanceof Error ? err.message : "Failed to load matrix");
      } finally {
        setLoading(false);
      }
    };

    fetchMatrix();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center">
        <p className="text-zinc-600">Loading urgency/value matrix...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-12 text-center">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  if (!quadrants) {
    return null;
  }

  const totalRelationships =
    quadrants["high-high"].length +
    quadrants["high-low"].length +
    quadrants["low-high"].length +
    quadrants["low-low"].length;

  if (totalRelationships === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center">
        <p className="mb-2 text-lg font-medium text-zinc-900">
          No Relationships Yet
        </p>
        <p className="text-sm text-zinc-600">
          Add relationships to see them organized by urgency and value.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-zinc-900">
          Relationship Priority Matrix
        </h2>
        <p className="mt-1 text-sm text-zinc-600">
          Relationships organized by urgency and value to help prioritize your time
        </p>
      </div>

      {/* 2x2 Matrix Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* High Urgency, High Value */}
        <div className="rounded-xl border-2 border-red-300 bg-red-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-red-900">
              High Urgency, High Value
            </h3>
            <span className="rounded-full bg-red-200 px-2 py-0.5 text-xs font-medium text-red-900">
              {quadrants["high-high"].length}
            </span>
          </div>
          <p className="mb-3 text-xs text-red-800">
            Focus here first. These relationships need attention and are valuable.
          </p>
          <div className="space-y-2">
            {quadrants["high-high"].length === 0 ? (
              <p className="text-xs text-red-700 italic">None</p>
            ) : (
              quadrants["high-high"].map((rel) => (
                <Link
                  key={rel.id}
                  href={`/app/leads/${rel.id}`}
                  className="block rounded-lg border border-red-200 bg-white p-2 text-sm transition-colors hover:bg-red-100"
                >
                  <div className="font-medium text-zinc-900">{rel.name}</div>
                  <div className="text-xs text-zinc-600">{rel.label}</div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* High Urgency, Low Value */}
        <div className="rounded-xl border-2 border-orange-300 bg-orange-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-orange-900">
              High Urgency, Low Value
            </h3>
            <span className="rounded-full bg-orange-200 px-2 py-0.5 text-xs font-medium text-orange-900">
              {quadrants["high-low"].length}
            </span>
          </div>
          <p className="mb-3 text-xs text-orange-800">
            Quick wins. Handle these efficiently to free up time for high-value relationships.
          </p>
          <div className="space-y-2">
            {quadrants["high-low"].length === 0 ? (
              <p className="text-xs text-orange-700 italic">None</p>
            ) : (
              quadrants["high-low"].map((rel) => (
                <Link
                  key={rel.id}
                  href={`/app/leads/${rel.id}`}
                  className="block rounded-lg border border-orange-200 bg-white p-2 text-sm transition-colors hover:bg-orange-100"
                >
                  <div className="font-medium text-zinc-900">{rel.name}</div>
                  <div className="text-xs text-zinc-600">{rel.label}</div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Low Urgency, High Value */}
        <div className="rounded-xl border-2 border-blue-300 bg-blue-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-blue-900">
              Low Urgency, High Value
            </h3>
            <span className="rounded-full bg-blue-200 px-2 py-0.5 text-xs font-medium text-blue-900">
              {quadrants["low-high"].length}
            </span>
          </div>
          <p className="mb-3 text-xs text-blue-800">
            Strategic relationships. Nurture these consistently but don&apos;t let urgency drive them.
          </p>
          <div className="space-y-2">
            {quadrants["low-high"].length === 0 ? (
              <p className="text-xs text-blue-700 italic">None</p>
            ) : (
              quadrants["low-high"].map((rel) => (
                <Link
                  key={rel.id}
                  href={`/app/leads/${rel.id}`}
                  className="block rounded-lg border border-blue-200 bg-white p-2 text-sm transition-colors hover:bg-blue-100"
                >
                  <div className="font-medium text-zinc-900">{rel.name}</div>
                  <div className="text-xs text-zinc-600">{rel.label}</div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Low Urgency, Low Value */}
        <div className="rounded-xl border-2 border-zinc-300 bg-zinc-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-900">
              Low Urgency, Low Value
            </h3>
            <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-900">
              {quadrants["low-low"].length}
            </span>
          </div>
          <p className="mb-3 text-xs text-zinc-700">
            Background relationships. Maintain minimal touchpoints when time allows.
          </p>
          <div className="space-y-2">
            {quadrants["low-low"].length === 0 ? (
              <p className="text-xs text-zinc-600 italic">None</p>
            ) : (
              quadrants["low-low"].map((rel) => (
                <Link
                  key={rel.id}
                  href={`/app/leads/${rel.id}`}
                  className="block rounded-lg border border-zinc-200 bg-white p-2 text-sm transition-colors hover:bg-zinc-100"
                >
                  <div className="font-medium text-zinc-900">{rel.name}</div>
                  <div className="text-xs text-zinc-600">{rel.label}</div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

