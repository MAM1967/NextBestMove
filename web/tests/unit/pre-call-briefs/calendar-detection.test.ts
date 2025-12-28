import { describe, it, expect } from "vitest";
import { isLikelyCall, getCallDetectionConfidence } from "@/lib/pre-call-briefs/calendar-detection";
import type { CalendarEvent } from "@/lib/pre-call-briefs/types";

describe("calendar-detection", () => {
  describe("isLikelyCall", () => {
    it("should return true for events with video conference link", () => {
      const event: CalendarEvent = {
        id: "1",
        title: "Meeting",
        start: "2025-01-01T10:00:00Z",
        end: "2025-01-01T11:00:00Z",
        duration: 60,
        isAllDay: false,
        hasVideoConference: true,
        videoConferenceLink: "https://zoom.us/j/123456",
      };

      expect(isLikelyCall(event)).toBe(true);
    });

    it("should return true for events with hasVideoConference flag", () => {
      const event: CalendarEvent = {
        id: "1",
        title: "Meeting",
        start: "2025-01-01T10:00:00Z",
        end: "2025-01-01T11:00:00Z",
        duration: 60,
        isAllDay: false,
        hasVideoConference: true,
      };

      expect(isLikelyCall(event)).toBe(true);
    });

    it("should return true for Zoom links in videoConferenceLink", () => {
      const event: CalendarEvent = {
        id: "1",
        title: "Meeting",
        start: "2025-01-01T10:00:00Z",
        end: "2025-01-01T11:00:00Z",
        duration: 60,
        isAllDay: false,
        videoConferenceLink: "https://zoom.us/j/123456",
      };

      expect(isLikelyCall(event)).toBe(true);
    });

    it("should return true for Google Meet links", () => {
      const event: CalendarEvent = {
        id: "1",
        title: "Meeting",
        start: "2025-01-01T10:00:00Z",
        end: "2025-01-01T11:00:00Z",
        duration: 60,
        isAllDay: false,
        videoConferenceLink: "https://meet.google.com/abc-defg-hij",
      };

      expect(isLikelyCall(event)).toBe(true);
    });

    it("should return true for Teams links", () => {
      const event: CalendarEvent = {
        id: "1",
        title: "Meeting",
        start: "2025-01-01T10:00:00Z",
        end: "2025-01-01T11:00:00Z",
        duration: 60,
        isAllDay: false,
        videoConferenceLink: "https://teams.microsoft.com/l/meetup-join/...",
      };

      expect(isLikelyCall(event)).toBe(true);
    });

    it("should return true for titles with Zoom keyword", () => {
      const event: CalendarEvent = {
        id: "1",
        title: "Zoom call with John",
        start: "2025-01-01T10:00:00Z",
        end: "2025-01-01T11:00:00Z",
        duration: 60,
        isAllDay: false,
      };

      expect(isLikelyCall(event)).toBe(true);
    });

    it("should return true for titles with Google Meet keyword", () => {
      const event: CalendarEvent = {
        id: "1",
        title: "Google Meet: Project Review",
        start: "2025-01-01T10:00:00Z",
        end: "2025-01-01T11:00:00Z",
        duration: 60,
        isAllDay: false,
      };

      expect(isLikelyCall(event)).toBe(true);
    });

    it("should return true for titles with Teams keyword", () => {
      const event: CalendarEvent = {
        id: "1",
        title: "Microsoft Teams sync",
        start: "2025-01-01T10:00:00Z",
        end: "2025-01-01T11:00:00Z",
        duration: 60,
        isAllDay: false,
      };

      expect(isLikelyCall(event)).toBe(true);
    });

    it("should return true for titles with generic call keyword", () => {
      const event: CalendarEvent = {
        id: "1",
        title: "Call with Sarah",
        start: "2025-01-01T10:00:00Z",
        end: "2025-01-01T11:00:00Z",
        duration: 60,
        isAllDay: false,
      };

      expect(isLikelyCall(event)).toBe(true);
    });

    it("should return true for titles with phone keyword", () => {
      const event: CalendarEvent = {
        id: "1",
        title: "Phone call with client",
        start: "2025-01-01T10:00:00Z",
        end: "2025-01-01T11:00:00Z",
        duration: 60,
        isAllDay: false,
      };

      expect(isLikelyCall(event)).toBe(true);
    });

    it("should return false for non-call events", () => {
      const event: CalendarEvent = {
        id: "1",
        title: "Lunch appointment",
        start: "2025-01-01T10:00:00Z",
        end: "2025-01-01T11:00:00Z",
        duration: 60,
        isAllDay: false,
      };

      expect(isLikelyCall(event)).toBe(false);
    });

    it("should be case-insensitive", () => {
      const event: CalendarEvent = {
        id: "1",
        title: "ZOOM CALL WITH JOHN",
        start: "2025-01-01T10:00:00Z",
        end: "2025-01-01T11:00:00Z",
        duration: 60,
        isAllDay: false,
      };

      expect(isLikelyCall(event)).toBe(true);
    });
  });

  describe("getCallDetectionConfidence", () => {
    it("should return high confidence for video conference link with platform pattern", () => {
      const event: CalendarEvent = {
        id: "1",
        title: "Meeting",
        start: "2025-01-01T10:00:00Z",
        end: "2025-01-01T11:00:00Z",
        duration: 60,
        isAllDay: false,
        videoConferenceLink: "https://zoom.us/j/123456",
      };

      expect(getCallDetectionConfidence(event)).toBe("high");
    });

    it("should return high confidence for hasVideoConference flag", () => {
      const event: CalendarEvent = {
        id: "1",
        title: "Meeting",
        start: "2025-01-01T10:00:00Z",
        end: "2025-01-01T11:00:00Z",
        duration: 60,
        isAllDay: false,
        hasVideoConference: true,
      };

      expect(getCallDetectionConfidence(event)).toBe("high");
    });

    it("should return medium confidence for platform-specific keywords", () => {
      const event: CalendarEvent = {
        id: "1",
        title: "Zoom call with John",
        start: "2025-01-01T10:00:00Z",
        end: "2025-01-01T11:00:00Z",
        duration: 60,
        isAllDay: false,
      };

      expect(getCallDetectionConfidence(event)).toBe("medium");
    });

    it("should return low confidence for generic call keywords", () => {
      const event: CalendarEvent = {
        id: "1",
        title: "Call with Sarah",
        start: "2025-01-01T10:00:00Z",
        end: "2025-01-01T11:00:00Z",
        duration: 60,
        isAllDay: false,
      };

      expect(getCallDetectionConfidence(event)).toBe("low");
    });
  });
});

