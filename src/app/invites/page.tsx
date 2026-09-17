import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getReceivedInvites, getSentInvites } from "@/lib/invites";
import Inner from "./inner";

export default async function InvitesPage() {
  const session = await getSession();
  if (!session) {
    return redirect("/login");
  }

  const [received, sent] = await Promise.all([
    getReceivedInvites(session.playerId),
    getSentInvites(session.playerId),
  ]);

  return (
    <Inner
      received={received.map((i) => ({
        gameId: i.game.id,
        variant: i.game.variant,
        opponentUsername: i.opponentUsername,
        side: i.side,
      }))}
      sent={sent.map((i) => ({
        gameId: i.game.id,
        variant: i.game.variant,
        opponentUsername: i.opponentUsername,
        side: i.side,
      }))}
    />
  );
}
