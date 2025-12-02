"use client";

import { useEffect, useState } from "react";
import { DowngradeWarningModal } from "./DowngradeWarningModal";

export function DowngradeWarningChecker() {
  const [shouldShow, setShouldShow] = useState(false);
  const [currentPinCount, setCurrentPinCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkDowngradeWarning = async () => {
      try {
        const response = await fetch("/api/billing/check-downgrade-warning");
        if (response.ok) {
          const data = await response.json();
          if (data.shouldShow) {
            setShouldShow(true);
            setCurrentPinCount(data.currentPinCount || 0);
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
      currentPinCount={currentPinCount}
      onAcknowledge={handleAcknowledge}
    />
  );
}

