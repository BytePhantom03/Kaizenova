"use client";
import PracticeSession from "@/components/skills/PracticeSession";
import { Handshake } from "lucide-react";

export default function HRPage() {
  return (
    <PracticeSession
      config={{
        trainer_type: "hr",
        title: "HR Communication Practice",
        subtitle: "Practice tell-me-about-yourself, behavioural STAR-method questions, and salary negotiation. Get coaching on communication, clarity, and professionalism.",
        icon: <Handshake className="h-5 w-5 text-purple-400" />,
        input_label: "Your Answer",
        input_placeholder: "Answer the HR question as you would in a real interview. Be specific and use the STAR method where applicable...",
        input_rows: 7,
      }}
    />
  );
}
