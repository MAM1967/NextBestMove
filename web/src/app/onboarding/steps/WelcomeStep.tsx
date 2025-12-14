"use client";

interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="space-y-6 text-center">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900">
          Welcome to NextBestMove
        </h1>
        <p className="mt-2 text-lg text-zinc-600">
          Small actions. Every day. Predictable revenue.
        </p>
      </div>

      <div className="space-y-4 text-left">
        <div className="flex items-start gap-3">
          <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600">
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <div>
            <p className="font-medium text-zinc-900">Daily Plan</p>
            <p className="text-sm text-zinc-600">
              Get a small, realistic list of revenue actions each day, sized to
              your schedule.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600">
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <div>
            <p className="font-medium text-zinc-900">Relationships</p>
            <p className="text-sm text-zinc-600">
              Keep context on the people you work with. We'll remind you when it's
              time to follow up.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600">
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <div>
            <p className="font-medium text-zinc-900">Weekly Review</p>
            <p className="text-sm text-zinc-600">
              See your progress, reflect on what worked, and set your focus for the week
              ahead.
            </p>
          </div>
        </div>
      </div>

      <div className="pt-4">
        <button
          type="button"
          onClick={onNext}
          className="w-full rounded-lg bg-purple-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
        >
          Get Started
        </button>
      </div>
    </div>
  );
}

