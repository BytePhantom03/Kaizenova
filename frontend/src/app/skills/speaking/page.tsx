"use client";
import PracticeSession from "@/components/skills/PracticeSession";
import { Mic } from "lucide-react";

export default function SpeakingPage() {
  return (
    <PracticeSession
      config={{
        trainer_type: "speaking",
        title: "English Speaking Practice",
        subtitle: "Answer AI interview-style questions. Get real-time feedback on your grammar, fluency, vocabulary, and confidence.",
        icon: <Mic className="h-5 w-5 text-primary" />,
        input_label: "Your Answer",
        input_placeholder: "Speak or type your answer here...",
        input_rows: 6,
      }}
    />
  );
}
