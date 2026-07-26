"use client";
import PracticeSession from "@/components/skills/PracticeSession";
import { Presentation } from "lucide-react";

export default function PublicSpeakingPage() {
  return (
    <PracticeSession
      config={{
        trainer_type: "public",
        title: "Public Speaking Coach",
        subtitle: "Rehearse speeches, presentations, and conference talks. AI scores your delivery, organisation, energy, and clarity with actionable coaching.",
        icon: <Presentation className="h-5 w-5 text-orange-400" />,
        input_label: "Your Speech",
        input_placeholder: "Type or dictate your speech here. Aim for at least 100 words — speak as if you are on stage...",
        input_rows: 8,
      }}
    />
  );
}
