"use client";
import PracticeSession from "@/components/skills/PracticeSession";
import { Zap } from "lucide-react";

export default function ConfidencePage() {
  return (
    <PracticeSession
      config={{
        trainer_type: "confidence",
        title: "Confidence Booster",
        subtitle: "Handle high-pressure situations — executive introductions, investor pitches, public criticism, and difficult clients — with instant assertiveness and composure coaching.",
        icon: <Zap className="h-5 w-5 text-yellow-400" />,
        input_label: "Your Response",
        input_placeholder: "Respond to the high-pressure situation. Be bold, direct, and confident. Don't hedge or over-apologise...",
        input_rows: 6,
      }}
    />
  );
}
