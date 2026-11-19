import type { Metadata } from "next";
import { HelpGuide } from "@/components/tasty-match/HelpGuide";

export const metadata: Metadata = {
  title: "How to Play & Connection Rules — Tasty Match: Mahjong Pairs",
  description:
    "Detailed visual guide and interactive tester explaining how Tasty Match works, how food tiles connect within 2 turns, outer corridor routing, stone blocks, and gravity shifts.",
};

export default function HelpPage() {
  return <HelpGuide />;
}
