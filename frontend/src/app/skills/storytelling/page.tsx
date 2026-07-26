"use client";
import PracticeSession from "@/components/skills/PracticeSession";
import { BookMarked } from "lucide-react";

export default function StorytellingPage() {
  return (
    <PracticeSession
      config={{
        trainer_type: "storytelling",
        title: "Storytelling Coach",
        subtitle: "Tell compelling stories using the STAR or narrative framework. AI analyses your structure, emotional impact, vocabulary, and flow.",
        icon: <BookMarked className="h-5 w-5 text-pink-400" />,
        input_label: "Your Story",
        input_placeholder: "Tell your story here. Use a clear beginning, middle, and end. Be specific — vivid details make stories memorable...",
        input_rows: 8,
      }}
    />
  );
}
