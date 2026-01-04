/**
 * Signal extraction utilities
 * 
 * Extracts topics, asks, and open loops from email content
 * Uses simple rule-based extraction (can be enhanced with AI later)
 */

/**
 * Extract potential "asks" from email text
 * Looks for question marks, question words, and imperative phrases
 */
export function extractAsks(text: string): string[] {
  const asks: string[] = [];
  const lowerText = text.toLowerCase();

  // Questions (sentences ending with ?)
  const questionRegex = /[^.!?]*\?/g;
  const questions = text.match(questionRegex) || [];
  asks.push(...questions.filter((q) => q.trim().length > 10).slice(0, 3));

  // Question words at start of sentences
  const questionWords = ["can you", "could you", "would you", "please", "can we", "should we"];
  questionWords.forEach((word) => {
    const regex = new RegExp(`(${word}[^.!?]*[.!?])`, "gi");
    const matches = text.match(regex);
    if (matches) {
      asks.push(...matches.slice(0, 2));
    }
  });

  // Action requests (imperative phrases)
  const actionPhrases = ["let me know", "send me", "follow up", "get back", "touch base"];
  actionPhrases.forEach((phrase) => {
    const regex = new RegExp(`([^.!?]*${phrase}[^.!?]*[.!?])`, "gi");
    const matches = text.match(regex);
    if (matches) {
      asks.push(...matches.slice(0, 2));
    }
  });

  // Deduplicate and clean
  const uniqueAsks = Array.from(new Set(asks.map((a) => a.trim())))
    .filter((a) => a.length > 10 && a.length < 200)
    .slice(0, 5);

  return uniqueAsks;
}

/**
 * Extract open loops (unresolved action items or topics)
 */
export function extractOpenLoops(text: string): string[] {
  const loops: string[] = [];
  const lowerText = text.toLowerCase();

  // Phrases that indicate open loops
  const loopIndicators = [
    "will follow up",
    "we should",
    "need to",
    "have to",
    "going to",
    "plan to",
    "pending",
    "still waiting",
    "waiting for",
    "next steps",
  ];

  loopIndicators.forEach((indicator) => {
    const regex = new RegExp(`([^.!?]*${indicator}[^.!?]*[.!?])`, "gi");
    const matches = text.match(regex);
    if (matches) {
      loops.push(...matches.slice(0, 2));
    }
  });

  // Deduplicate and clean
  const uniqueLoops = Array.from(new Set(loops.map((l) => l.trim())))
    .filter((l) => l.length > 10 && l.length < 200)
    .slice(0, 5);

  return uniqueLoops;
}

/**
 * Extract topic/keywords from email
 * Simple keyword extraction (subject + key phrases)
 */
export function extractTopic(subject: string, snippet: string): string {
  // Use subject as primary topic, fallback to first sentence of snippet
  if (subject && subject.length > 0) {
    // Clean subject (remove RE:, FWD:, etc.)
    const cleaned = subject.replace(/^(RE|FWD|Fw):\s*/i, "").trim();
    if (cleaned.length > 5 && cleaned.length < 100) {
      return cleaned;
    }
  }

  // Fallback to first sentence of snippet
  const firstSentence = snippet.split(/[.!?]/)[0].trim();
  if (firstSentence.length > 10 && firstSentence.length < 100) {
    return firstSentence;
  }

  return subject || "No topic";
}

/**
 * Extract priority from email
 */
export function extractPriority(
  subject: string,
  snippet: string,
  importance?: string
): "high" | "medium" | "low" | "normal" {
  const lowerSubject = subject.toLowerCase();
  const lowerSnippet = snippet.toLowerCase();

  // Check importance field (Outlook)
  if (importance === "high") {
    return "high";
  }

  // Check for high-priority keywords
  const highPriorityKeywords = ["urgent", "asap", "important", "critical", "deadline"];
  if (highPriorityKeywords.some((kw) => lowerSubject.includes(kw) || lowerSnippet.includes(kw))) {
    return "high";
  }

  // Check for low-priority keywords
  const lowPriorityKeywords = ["whenever", "no rush", "low priority"];
  if (lowPriorityKeywords.some((kw) => lowerSubject.includes(kw) || lowerSnippet.includes(kw))) {
    return "low";
  }

  return "normal";
}

/**
 * Extract all signals from email metadata
 */
export function extractSignals(
  subject: string,
  snippet: string,
  importance?: string
): {
  topic: string;
  asks: string[];
  openLoops: string[];
  priority: "high" | "medium" | "low" | "normal";
} {
  const fullText = `${subject} ${snippet}`;

  return {
    topic: extractTopic(subject, snippet),
    asks: extractAsks(fullText),
    openLoops: extractOpenLoops(fullText),
    priority: extractPriority(subject, snippet, importance),
  };
}

