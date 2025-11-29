"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { WelcomeStep } from "./steps/WelcomeStep";
import { PinFirstPersonStep } from "./steps/PinFirstPersonStep";
import { CalendarConnectStep } from "./steps/CalendarConnectStep";
import { WorkingHoursStep } from "./steps/WorkingHoursStep";
import { WeekendPreferenceStep } from "./steps/WeekendPreferenceStep";
import { WeeklyFocusStep } from "./steps/WeeklyFocusStep";
import { FirstPlanReadyStep } from "./steps/FirstPlanReadyStep";
import { StartFreeTrialStep } from "./steps/StartFreeTrialStep";

export type OnboardingStep =
  | "welcome"
  | "pin_first_person"
  | "calendar_connect"
  | "working_hours"
  | "weekend_preference"
  | "weekly_focus"
  | "first_plan_ready"
  | "start_free_trial";

const STEPS: OnboardingStep[] = [
  "welcome",
  "pin_first_person",
  "calendar_connect",
  "working_hours",
  "weekend_preference",
  "weekly_focus",
  "first_plan_ready",
  "start_free_trial",
];

const ONBOARDING_STEP_KEY = "nbm_onboarding_step";

function getSavedStep(): OnboardingStep | null {
  if (typeof window === "undefined") return null;
  const saved = localStorage.getItem(ONBOARDING_STEP_KEY);
  if (saved && STEPS.includes(saved as OnboardingStep)) {
    return saved as OnboardingStep;
  }
  return null;
}

function saveStep(step: OnboardingStep) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ONBOARDING_STEP_KEY, step);
}

function clearSavedStep() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ONBOARDING_STEP_KEY);
}

export function OnboardingFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Initialize step from localStorage or default to welcome
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(() => {
    return getSavedStep() || "welcome";
  });
  const [completedSteps, setCompletedSteps] = useState<Set<OnboardingStep>>(
    new Set()
  );

  // Restore step when component mounts (e.g., after OAuth redirect)
  useEffect(() => {
    // If returning from calendar OAuth, ensure we're on calendar_connect step
    const calendarParam = searchParams.get("calendar");
    if (calendarParam === "success" || calendarParam === "error") {
      // Make sure we're on the calendar step
      setCurrentStep("calendar_connect");
      saveStep("calendar_connect");
      // Clean up URL params
      router.replace("/onboarding", { scroll: false });
    } else {
      // Otherwise, restore saved step if available
      const savedStep = getSavedStep();
      if (savedStep && savedStep !== currentStep) {
        setCurrentStep(savedStep);
      }
    }
  }, [searchParams, router]); // Removed currentStep from deps to avoid loop

  const currentStepIndex = STEPS.indexOf(currentStep);
  const totalSteps = STEPS.length;

  const handleNext = () => {
    setCompletedSteps((prev) => new Set([...prev, currentStep]));
    if (currentStepIndex < STEPS.length - 1) {
      const nextStep = STEPS[currentStepIndex + 1];
      setCurrentStep(nextStep);
      saveStep(nextStep);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      const prevStep = STEPS[currentStepIndex - 1];
      setCurrentStep(prevStep);
      saveStep(prevStep);
    }
  };

  const handleSkip = () => {
    setCompletedSteps((prev) => new Set([...prev, currentStep]));
    if (currentStepIndex < STEPS.length - 1) {
      const nextStep = STEPS[currentStepIndex + 1];
      setCurrentStep(nextStep);
      saveStep(nextStep);
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
        clearSavedStep();
        router.push("/app");
        router.refresh();
      } else {
        console.error("Failed to complete onboarding");
        // Still redirect to app even if API call fails
        clearSavedStep();
        router.push("/app");
      }
    } catch (error) {
      console.error("Error completing onboarding:", error);
      clearSavedStep();
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
      case "start_free_trial":
        return (
          <StartFreeTrialStep
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

