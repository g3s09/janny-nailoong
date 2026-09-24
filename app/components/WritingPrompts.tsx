"use client";
import { Sparkles } from "lucide-react";

export default function WritingPrompts({
  ideas,
  onChoose,
}: {
  ideas: string[];
  onChoose: (idea: string) => void;
}) {
  return (
    <div className="writing-prompts">
      <p>
        <Sparkles size={14} aria-hidden="true" /> ¿Por dónde empezar?
      </p>
      <div role="group" aria-label="Ideas para escribir">
        {ideas.map((idea) => (
          <button type="button" key={idea} onClick={() => onChoose(idea)}>
            {idea}
          </button>
        ))}
      </div>

    </div>
  );
}
