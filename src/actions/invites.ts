"use server";

import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { serialize } from "cookie";

function doUrl(gameId: string, action: "accept" | "decline"): string {
  return process.env.NODE_ENV === "development"
    ? `http://localhost:8787/do/games/${gameId}/${action}`
    : `https://capstone.mrvillage.dev/do/games/${gameId}/${action}`;
}

async function callDo(
  gameId: string,
  action: "accept" | "decline",
): Promise<boolean> {
  const session = await getSession();
  if (!session) {
    return false;
  }
  const res = await fetch(doUrl(gameId, action), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: serialize("session_token", session.token),
    },
    body: JSON.stringify({ sessionToken: session.token }),
  });
  return res.ok;
}

export async function acceptInvite(gameId: string): Promise<void> {
  const ok = await callDo(gameId, "accept");
  revalidatePath("/invites");
  if (ok) {
    redirect(`/games/${gameId}`);
  }
}

export type DeclineInviteState = {
  message?: string;
};

export async function declineInvite(
  gameId: string,
): Promise<DeclineInviteState> {
  const ok = await callDo(gameId, "decline");
  revalidatePath("/invites");
  if (!ok) {
    return { message: "Failed to decline invite. Please try again." };
  }
  return {};
}

export async function cancelInvite(
  gameId: string,
): Promise<DeclineInviteState> {
  // cancelling a sent invite uses the same DO endpoint as declining one
  return declineInvite(gameId);
}
