"use client";

import { format } from "date-fns";

interface VoiceProfile {
  characteristics: {
    tone: string;
    formality: string;
    sentence_length: string;
    vocabulary_level: string;
    common_phrases: string[];
    writing_patterns?: {
      greeting_style?: string;
      closing_style?: string;
      punctuation_preference?: string;
    };
    topics?: string[];
    sample_texts?: string[];
  };
  sampleCount: number;
  lastUpdated: string;
}

interface VoiceProfileCardProps {
  profile: VoiceProfile;
}

export function VoiceProfileCard({ profile }: VoiceProfileCardProps) {
  const { characteristics, sampleCount, lastUpdated } = profile;

  return (
    <div className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-zinc-900">Voice Profile</p>
        <span className="text-xs text-zinc-500">
          Updated {format(new Date(lastUpdated), "MMM d, yyyy")}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="font-medium text-zinc-700">Tone</p>
          <p className="text-zinc-600 capitalize">{characteristics.tone}</p>
        </div>
        <div>
          <p className="font-medium text-zinc-700">Formality</p>
          <p className="text-zinc-600 capitalize">{characteristics.formality}</p>
        </div>
        <div>
          <p className="font-medium text-zinc-700">Sentence Length</p>
          <p className="text-zinc-600 capitalize">{characteristics.sentence_length}</p>
        </div>
        <div>
          <p className="font-medium text-zinc-700">Vocabulary</p>
          <p className="text-zinc-600 capitalize">{characteristics.vocabulary_level}</p>
        </div>
      </div>

      {characteristics.writing_patterns && (
        <div className="border-t border-zinc-200 pt-3">
          <p className="text-xs font-medium text-zinc-700 mb-2">Writing Patterns</p>
          <div className="space-y-1 text-xs text-zinc-600">
            {characteristics.writing_patterns.greeting_style && (
              <p>
                <span className="font-medium">Greeting:</span> {characteristics.writing_patterns.greeting_style}
              </p>
            )}
            {characteristics.writing_patterns.closing_style && (
              <p>
                <span className="font-medium">Closing:</span> {characteristics.writing_patterns.closing_style}
              </p>
            )}
          </div>
        </div>
      )}

      {characteristics.common_phrases && characteristics.common_phrases.length > 0 && (
        <div className="border-t border-zinc-200 pt-3">
          <p className="text-xs font-medium text-zinc-700 mb-2">Common Phrases</p>
          <div className="flex flex-wrap gap-1">
            {characteristics.common_phrases.slice(0, 5).map((phrase, index) => (
              <span
                key={index}
                className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700"
              >
                {phrase}
              </span>
            ))}
            {characteristics.common_phrases.length > 5 && (
              <span className="text-xs text-zinc-500">
                +{characteristics.common_phrases.length - 5} more
              </span>
            )}
          </div>
        </div>
      )}

      <div className="border-t border-zinc-200 pt-2">
        <p className="text-xs text-zinc-500">
          Analyzed from <span className="font-medium">{sampleCount}</span> text sample{sampleCount !== 1 ? "s" : ""} (≥50 characters each)
        </p>
      </div>
    </div>
  );
}

