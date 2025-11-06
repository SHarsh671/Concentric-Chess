"use client";

import { useGameSocket } from "@/lib/ws";
import { use, useEffect } from "react";

export default function GamePage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = use(params);
  const ws = useGameSocket(gameId);
  useEffect(() => {
    ws.setListener((message) => {
      console.log("Received message:", message);
    });
    return () => {
      ws.setListener(null);
      ws.disconnect();
    };
  }, []);
  return <>Game Page</>;
}
