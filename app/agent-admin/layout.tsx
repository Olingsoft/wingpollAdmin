import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Agent Admin Console",
  description: "WingPoll Agent Admin workspace for tasks and submissions.",
  path: "/agent-admin",
  noIndex: true,
});

export default function AgentAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

