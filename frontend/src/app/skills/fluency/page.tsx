"use client";
import PracticeSession from "@/components/skills/PracticeSession";
import { MessageSquare } from "lucide-react";

export default function FluencyPage() {
  return (
    <PracticeSession
      config={{
        trainer_type: "fluency",
        title: "Fluency Coach",
        subtitle: "AI gives you a topic. Speak for 1–2 minutes as naturally as possible. Get detailed feedback on your pace, filler words, hesitation, and coherence.",
        icon: <MessageSquare className="h-5 w-5 text-primary" />,
        extra_config: { difficulty: "intermediate" },
        input_label: "Your Monologue",
        input_placeholder: "Write or dictate what you would say about this topic. Aim for at least 150 words...",
        input_rows: 8,
      }}
    />
  );
}
