"use client";
import PracticeSession from "@/components/skills/PracticeSession";
import { Crown } from "lucide-react";

export default function LeadershipPage() {
  return (
    <PracticeSession
      config={{
        trainer_type: "leadership",
        title: "Leadership Communication",
        subtitle: "Practice giving instructions, feedback, conflict resolution, and motivation in real leadership scenarios. AI evaluates authority, empathy, and decisiveness.",
        icon: <Crown className="h-5 w-5 text-amber-400" />,
        input_label: "Your Response",
        input_placeholder: "Respond to the leadership scenario as you would in a real management or team lead situation. Be specific and direct...",
        input_rows: 7,
      }}
    />
  );
}
