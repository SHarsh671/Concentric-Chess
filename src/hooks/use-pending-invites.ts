"use client";

import { useEffect, useRef, useState } from "react";
import "client-only";

export type InviteSummary = {
  gameId: string;
  variant: string;
  opponentUsername: string;
  side: "white" | "black";
};

type InvitesResponse = {
  received: InviteSummary[];
  sent: InviteSummary[];
};

const POLL_INTERVAL_MS = 8000;

// Polls for pending game invites while the user is logged in and signed into
// the app shell. Kept intentionally simple (polling, not a websocket/durable
// object channel) since invites are low-frequency and this avoids standing up
// extra realtime infrastructure just for notifications.
export function usePendingInvites(enabled: boolean) {
  const [invites, setInvites] = useState<InvitesResponse>({
    received: [],
    sent: [],
  });
  const onNewReceivedRef = useRef<(invite: InviteSummary) => void>(() => {});
  const seenIds = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch("/api/invites", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as InvitesResponse;
        if (cancelled) return;

        const currentIds = new Set(data.received.map((i) => i.gameId));
        if (seenIds.current) {
          for (const invite of data.received) {
            if (!seenIds.current.has(invite.gameId)) {
              onNewReceivedRef.current(invite);
            }
          }
        }
        seenIds.current = currentIds;
        setInvites(data);
      } catch {
        // ignore transient network errors; we'll retry on the next tick
      }
    };

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [enabled]);

  return {
    invites,
    onNewReceivedInvite: (cb: (invite: InviteSummary) => void) => {
      onNewReceivedRef.current = cb;
    },
  };
}
