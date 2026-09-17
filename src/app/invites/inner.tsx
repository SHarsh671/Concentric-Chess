"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { LoaderCircle, Mail, Send, Swords } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { acceptInvite, cancelInvite, declineInvite } from "@/actions/invites";

type Invite = {
  gameId: string;
  variant: string;
  opponentUsername: string;
  side: "white" | "black";
};

function formatVariant(variant: string): string {
  return variant.replace("-", " ").toUpperCase();
}

export default function InvitesInner({
  received,
  sent,
}: {
  received: Invite[];
  sent: Invite[];
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleAccept = (gameId: string) => {
    setPendingId(gameId);
    startTransition(async () => {
      await acceptInvite(gameId);
      setPendingId(null);
    });
  };

  const handleDecline = (gameId: string) => {
    setPendingId(gameId);
    startTransition(async () => {
      const res = await declineInvite(gameId);
      if (res.message) toast.error(res.message);
      setPendingId(null);
    });
  };

  const handleCancel = (gameId: string) => {
    setPendingId(gameId);
    startTransition(async () => {
      const res = await cancelInvite(gameId);
      if (res.message) toast.error(res.message);
      setPendingId(null);
    });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invites</h1>
          <p className="text-muted-foreground mt-2">
            Manage game invites you&apos;ve received and sent
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="size-5" /> Received
            </CardTitle>
            <CardDescription>
              Invites from other players waiting on your response
            </CardDescription>
          </CardHeader>
          <CardContent>
            {received.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No pending invites.
              </p>
            ) : (
              <div className="space-y-3">
                {received.map((invite) => (
                  <div
                    key={invite.gameId}
                    className="flex items-center justify-between gap-4 rounded-md border p-3"
                  >
                    <div>
                      <p className="font-semibold">{invite.opponentUsername}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatVariant(invite.variant)} · you play {invite.side}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={isPending && pendingId === invite.gameId}
                        onClick={() => handleAccept(invite.gameId)}
                      >
                        {isPending && pendingId === invite.gameId ? (
                          <LoaderCircle className="size-4 animate-spin" />
                        ) : (
                          <Swords className="size-4" />
                        )}
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isPending && pendingId === invite.gameId}
                        onClick={() => handleDecline(invite.gameId)}
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="size-5" /> Sent
            </CardTitle>
            <CardDescription>
              Invites you&apos;ve sent that are waiting on the other player
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No pending sent invites.
              </p>
            ) : (
              <div className="space-y-3">
                {sent.map((invite) => (
                  <div
                    key={invite.gameId}
                    className="flex items-center justify-between gap-4 rounded-md border p-3"
                  >
                    <div>
                      <p className="font-semibold">{invite.opponentUsername}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatVariant(invite.variant)} · you play {invite.side}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isPending && pendingId === invite.gameId}
                      onClick={() => handleCancel(invite.gameId)}
                    >
                      {isPending && pendingId === invite.gameId ? (
                        <LoaderCircle className="size-4 animate-spin" />
                      ) : (
                        ""
                      )}
                      Cancel
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
