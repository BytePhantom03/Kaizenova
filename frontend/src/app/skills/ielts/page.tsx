"use client";
import PracticeSession from "@/components/skills/PracticeSession";
import { Trophy } from "lucide-react";

export default function IELTSPage() {
  return (
    <PracticeSession
      config={{
        trainer_type: "ielts",
        title: "IELTS Speaking Trainer",
        subtitle: "Full IELTS Speaking simulation — Parts 1, 2, and 3. Receive a band score, examiner-style feedback, and a model Band 8–9 answer for each question.",
        icon: <Trophy className="h-5 w-5 text-yellow-400" />,
        sub_mode: "part1",
        input_label: "Your Response",
        input_placeholder: "Respond as you would in an actual IELTS exam. Aim for natural, detailed answers...",
        input_rows: 7,
      }}
    />
  );
}
