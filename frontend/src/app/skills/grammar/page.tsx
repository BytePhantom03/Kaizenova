"use client";
import PracticeSession from "@/components/skills/PracticeSession";
import { PenLine } from "lucide-react";

export default function GrammarPage() {
  return (
    <PracticeSession
      config={{
        trainer_type: "grammar",
        title: "Grammar Trainer",
        subtitle: "AI generates grammar exercises — error correction, sentence rewriting, and more. Get instant corrections, rule explanations, and a final accuracy score.",
        icon: <PenLine className="h-5 w-5 text-emerald-400" />,
        extra_config: { exercise_type: "error_correction", difficulty: "intermediate" },
        input_label: "Your Answer",
        input_placeholder: "Write the corrected or rewritten sentence here...",
        input_rows: 4,
      }}
    />
  );
}
