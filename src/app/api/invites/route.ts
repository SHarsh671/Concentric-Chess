import { getSession } from "@/lib/auth";
import { getReceivedInvites, getSentInvites } from "@/lib/invites";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ received: [], sent: [] });
  }
  const [received, sent] = await Promise.all([
    getReceivedInvites(session.playerId),
    getSentInvites(session.playerId),
  ]);
  return NextResponse.json({
    received: received.map((i) => ({
      gameId: i.game.id,
      variant: i.game.variant,
      opponentUsername: i.opponentUsername,
      side: i.side,
    })),
    sent: sent.map((i) => ({
      gameId: i.game.id,
      variant: i.game.variant,
      opponentUsername: i.opponentUsername,
      side: i.side,
    })),
  });
}
