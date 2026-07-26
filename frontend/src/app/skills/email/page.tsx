"use client";
import PracticeSession from "@/components/skills/PracticeSession";
import { Mail } from "lucide-react";

export default function EmailPage() {
  return (
    <PracticeSession
      config={{
        trainer_type: "email",
        title: "Email Writing Coach",
        subtitle: "Write professional emails in response to AI-generated workplace tasks. Get instant feedback on tone, professionalism, grammar, and formatting.",
        icon: <Mail className="h-5 w-5 text-blue-400" />,
        input_label: "Your Email",
        input_placeholder: "Write your complete professional email here. Include a subject line, greeting, body, and sign-off...",
        input_rows: 10,
      }}
    />
  );
}
