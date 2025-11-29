"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WelcomeStep } from "./steps/WelcomeStep";
import { PinFirstPersonStep } from "./steps/PinFirstPersonStep";
import { CalendarConnectStep } from "./steps/CalendarConnectStep";
import { WorkingHoursStep } from "./steps/WorkingHoursStep";
import { WeekendPreferenceStep } from "./steps/WeekendPreferenceStep";
import { WeeklyFocusStep } from "./steps/WeeklyFocusStep";
import { FirstPlanReadyStep } from "./steps/FirstPlanReadyStep";
import { FastWinCoachingStep } from "./steps/FastWinCoachingStep";

export type OnboardingStep =
  | "welcome"
  | "pin_first_person"
  | "calendar_connect"
  | "working_hours"
  | "weekend_preference"
  | "weekly_focus"
  | "first_plan_ready"
  | "fast_win_coaching";

const STEPS: OnboardingStep[] = [
  "welcome",
  "pin_first_person",
  "calendar_connect",
  "working_hours",
  "weekend_preference",
  "weekly_focus",
  "first_plan_ready",
  "fast_win_coaching",
];

export function OnboardingFlow() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("welcome");
  const [completedSteps, setCompletedSteps] = useState<Set<OnboardingStep>>(
    new Set()
  );

  const currentStepIndex = STEPS.indexOf(currentStep);
  const totalSteps = STEPS.length;

  const handleNext = () => {
    setCompletedSteps((prev) => new Set([...prev, currentStep]));
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentStepIndex + 1]);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(STEPS[currentStepIndex - 1]);
    }
  };

  const handleSkip = () => {
    setCompletedSteps((prev) => new Set([...prev, currentStep]));
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentStepIndex + 1]);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    try {
      // Mark onboarding as completed
      const response = await fetch("/api/users/complete-onboarding", {
        method: "POST",
      });

      if (response.ok) {
        router.push("/app");
        router.refresh();
      } else {
        console.error("Failed to complete onboarding");
        // Still redirect to app even if API call fails
        router.push("/app");
      }
    } catch (error) {
      console.error("Error completing onboarding:", error);
      router.push("/app");
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case "welcome":
        return <WelcomeStep onNext={handleNext} />;
      case "pin_first_person":
        return <PinFirstPersonStep onNext={handleNext} onBack={handleBack} />;
      case "calendar_connect":
        return (
          <CalendarConnectStep
            onNext={handleNext}
            onBack={handleBack}
            onSkip={handleSkip}
          />
        );
      case "working_hours":
        return (
          <WorkingHoursStep
            onNext={handleNext}
            onBack={handleBack}
            onSkip={handleSkip}
          />
        );
      case "weekend_preference":
        return (
          <WeekendPreferenceStep
            onNext={handleNext}
            onBack={handleBack}
            onSkip={handleSkip}
          />
        );
      case "weekly_focus":
        return (
          <WeeklyFocusStep
            onNext={handleNext}
            onBack={handleBack}
            onSkip={handleSkip}
          />
        );
      case "first_plan_ready":
        return (
          <FirstPlanReadyStep
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case "fast_win_coaching":
        return (
          <FastWinCoachingStep
            onNext={handleComplete}
            onBack={handleBack}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between text-sm text-zinc-600">
          <span>Step {currentStepIndex + 1} of {totalSteps}</span>
          <span className="text-zinc-400">
            {Math.round(((currentStepIndex + 1) / totalSteps) * 100)}%
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200">
          <div
            className="h-full bg-purple-600 transition-all duration-300"
            style={{
              width: `${((currentStepIndex + 1) / totalSteps) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
        {renderStep()}
      </div>
    </div>
  );
}

