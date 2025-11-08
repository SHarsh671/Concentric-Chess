import { db } from "@/lib/db";
import { NextRequest } from "next/server";
import * as t from "drizzle-orm";
import { schema } from "shared";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> },
) {
  const { gameId } = await params;
  const game = await db().query.gamesTable.findFirst({
    where: t.eq(schema.gamesTable.id, gameId),
  });
  if (!game) {
    return new Response("Game not found", { status: 404 });
  }
  const upgradeHeader = request.headers.get("Upgrade");
  if (!upgradeHeader || upgradeHeader !== "websocket") {
    return new Response("Worker expected Upgrade: websocket", {
      status: 426,
    });
  }

  if (request.method !== "GET") {
    return new Response("Worker expected GET method", {
      status: 400,
    });
  }

  request.headers.set("Game-ID", gameId);
  return getCloudflareContext()
    .env.GAME_OBJECT.getByName(gameId)
    .fetch(request);
}
