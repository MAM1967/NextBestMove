"use client";

import { useState, useRef, useEffect } from "react";
import type { PreCallBrief } from "@/lib/pre-call-briefs/types";
import { PreCallBriefCard } from "./PreCallBriefCard";

interface PreCallBriefCarouselProps {
  briefs: PreCallBrief[];
  isPremium: boolean;
  onViewFull: (brief: PreCallBrief) => void;
}

export function PreCallBriefCarousel({
  briefs,
  isPremium,
  onViewFull,
}: PreCallBriefCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);

  // Scroll to current index when it changes (only for button clicks, not scroll events)
  useEffect(() => {
    if (scrollContainerRef.current && !isScrollingRef.current) {
      const container = scrollContainerRef.current;
      const children = container.children;
      
      if (children[currentIndex]) {
        const targetCard = children[currentIndex] as HTMLElement;
        const scrollPosition = targetCard.offsetLeft - container.offsetLeft;
        
        isScrollingRef.current = true;
        container.scrollTo({
          left: scrollPosition,
          behavior: "smooth",
        });
        
        // Reset flag after scroll completes
        setTimeout(() => {
          isScrollingRef.current = false;
        }, 300);
      }
    }
  }, [currentIndex, briefs.length]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : briefs.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < briefs.length - 1 ? prev + 1 : 0));
  };

  const handleScroll = () => {
    // Ignore scroll events during programmatic scrolling
    if (isScrollingRef.current) return;
    
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollLeft = container.scrollLeft;
      const children = container.children;
      
      // Find which card is currently most visible
      let closestIndex = 0;
      let closestDistance = Infinity;
      
      for (let i = 0; i < children.length; i++) {
        const card = children[i] as HTMLElement;
        const cardLeft = card.offsetLeft - container.offsetLeft;
        const distance = Math.abs(scrollLeft - cardLeft);
        
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = i;
        }
      }
      
      if (closestIndex !== currentIndex) {
        setCurrentIndex(closestIndex);
      }
    }
  };

  if (briefs.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Header with count and navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-zinc-900">
            Upcoming Calls
          </h3>
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
            {briefs.length} {briefs.length === 1 ? "call" : "calls"}
          </span>
        </div>
        {briefs.length > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevious}
              className="rounded-md p-1.5 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              aria-label="Previous call"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div className="flex gap-1">
              {briefs.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-1.5 rounded-full transition-all ${
                    index === currentIndex
                      ? "w-6 bg-blue-600"
                      : "w-1.5 bg-zinc-300 hover:bg-zinc-400"
                  }`}
                  aria-label={`Go to call ${index + 1}`}
                />
              ))}
            </div>
            <button
              onClick={handleNext}
              className="rounded-md p-1.5 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              aria-label="Next call"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Carousel container */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex gap-4 overflow-x-auto scroll-smooth scrollbar-hide pb-2"
        style={{
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {briefs.map((brief, index) => (
          <div
            key={brief.calendarEventId}
            className="flex-shrink-0 w-full"
            style={{ 
              scrollSnapAlign: "start",
              minWidth: "100%",
            }}
          >
            <PreCallBriefCard
              brief={brief}
              isPremium={isPremium}
              onViewFull={() => onViewFull(brief)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

