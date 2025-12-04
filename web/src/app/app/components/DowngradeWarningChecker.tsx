"use client";

import { useEffect, useState } from "react";
import { DowngradeWarningModal } from "./DowngradeWarningModal";

export function DowngradeWarningChecker() {
  const [shouldShow, setShouldShow] = useState(false);
  const [currentLeadCount, setCurrentLeadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkDowngradeWarning = async () => {
      try {
        const response = await fetch("/api/billing/check-downgrade-warning");
        if (response.ok) {
          let data;
          try {
            data = await response.json();
          } catch (jsonError) {
            console.error("Failed to parse downgrade warning response as JSON:", jsonError);
            return;
          }
          if (data.shouldShow) {
            setShouldShow(true);
            setCurrentLeadCount(data.currentLeadCount || data.currentPinCount || 0); // Support both for backward compatibility
          }
        }
      } catch (error) {
        console.error("Error checking downgrade warning:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkDowngradeWarning();
  }, []);

  const handleAcknowledge = () => {
    setShouldShow(false);
  };

  if (isLoading || !shouldShow) {
    return null;
  }

  return (
    <DowngradeWarningModal
      isOpen={shouldShow}
      onClose={handleAcknowledge}
      currentLeadCount={currentLeadCount}
      onAcknowledge={handleAcknowledge}
    />
  );
}

