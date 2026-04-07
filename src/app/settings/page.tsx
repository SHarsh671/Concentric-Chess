import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { playersTable } from "shared";
import * as t from "drizzle-orm";
import Inner from "./inner";

export default async function Page() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  const player = await db()
    .select({ requireMoveConfirmation: playersTable.requireMoveConfirmation })
    .from(playersTable)
    .where(t.eq(playersTable.id, session.playerId))
    .limit(1)
    .then((rows) => rows[0]);

  return (
    <Inner
      requireMoveConfirmation={(player?.requireMoveConfirmation ?? 1) === 1}
    />
  );
}
