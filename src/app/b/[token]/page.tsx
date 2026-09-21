"use client";

import { useParams } from "next/navigation";
import { StageCraftApp } from "@/components/stagecraft-app";

export default function BandLinkPage() {
  const params = useParams<{ token: string }>();
  return <StageCraftApp bandToken={params.token} />;
}
