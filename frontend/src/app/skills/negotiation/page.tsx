"use client";
import PracticeSession from "@/components/skills/PracticeSession";
import { Users2 } from "lucide-react";

export default function NegotiationPage() {
  return (
    <PracticeSession
      config={{
        trainer_type: "negotiation",
        title: "Negotiation Practice",
        subtitle: "Roleplay salary, vendor, and client negotiations against an AI counterpart that challenges your reasoning and pushes back on weak arguments.",
        icon: <Users2 className="h-5 w-5 text-red-400" />,
        extra_config: { role: "hr" },
        input_label: "Your Negotiation Response",
        input_placeholder: "Respond to the negotiation scenario. Be assertive, back your position with logic, and use persuasive language...",
        input_rows: 7,
      }}
    />
  );
}
