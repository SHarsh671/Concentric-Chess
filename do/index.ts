import { DurableObject } from "cloudflare:workers";
import { drizzle, DrizzleD1Database } from "drizzle-orm/d1";
import { parse } from "cookie";
import { ClientMsg, schema, sessionsTable } from "shared";
import * as t from "drizzle-orm";

export class GameObject extends DurableObject<CloudflareEnv> {
  db: DrizzleD1Database<typeof schema>;
  sockets: Map<WebSocket, { gameId: string; playerId: string }>;

  constructor(ctx: DurableObjectState, env: CloudflareEnv) {
    super(ctx, env);
    this.db = drizzle(env.DB, { schema });
    this.sockets = new Map();

    this.ctx.getWebSockets().forEach((ws) => {
      const attachment = ws.deserializeAttachment();
      if (attachment) {
        this.sockets.set(ws, { ...attachment });
      }
    });

    this.ctx.setWebSocketAutoResponse(
      new WebSocketRequestResponsePair("ping", "pong"),
    );
  }

  async getGame(gameId: string) {
    return this.db.query.gamesTable.findFirst({
      where: t.eq(schema.gamesTable.id, gameId),
    });
  }

  async fetch(request: Request) {
    const cookie = parse(request.headers.get("Cookie") || "");
    const gameId = request.headers.get("Game-ID") || "";
    if (!gameId) {
      return new Response("Game ID missing", { status: 400 });
    }
    const sessionToken = cookie["session_token"] ?? "";
    const session = await this.db.query.sessionsTable.findFirst({
      where: t.and(
        t.eq(sessionsTable.token, sessionToken),
        t.gt(sessionsTable.expiresAt, new Date().toISOString()),
      ),
    });
    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }
    const game = await this.getGame(gameId);
    if (!game) {
      return new Response("Game not found", { status: 404 });
    }
    if (game.status !== "ongoing" || game.deletedAt !== null) {
      return new Response("Game is not ongoing", { status: 403 });
    }

    const websocketPair = new WebSocketPair();
    const [client, server] = Object.values(websocketPair);

    this.ctx.acceptWebSocket(server);

    server.serializeAttachment({ gameId, playerId: session.playerId });
    this.sockets.set(server, { gameId, playerId: session.playerId });

    // reset disconnection timestamps
    if (session.playerId === game.whitePlayerId && game.whiteDisconnectedAt) {
      await this.db
        .update(schema.gamesTable)
        .set({ whiteDisconnectedAt: null })
        .where(t.eq(schema.gamesTable.id, game.id));
    } else if (
      session.playerId === game.blackPlayerId &&
      game.blackDisconnectedAt
    ) {
      await this.db
        .update(schema.gamesTable)
        .set({ blackDisconnectedAt: null })
        .where(t.eq(schema.gamesTable.id, game.id));
    }

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    const msg: ClientMsg = JSON.parse(message.toString());
    switch (msg.type) {
      case "move":
        // Handle move logic here
        break;
      case "resign":
        // Handle resign logic here
        break;
    }
  }

  async webSocketClose(
    ws: WebSocket,
    _code: number,
    _reason: string,
    _wasClean: boolean,
  ) {
    this.sockets.delete(ws);
    const game = await this.getGame(this.sockets.get(ws)?.gameId || "");
    if (game) {
      const socketInfo = this.sockets.get(ws);
      if (socketInfo) {
        const now = new Date().toISOString();
        if (socketInfo.playerId === game.whitePlayerId) {
          await this.db
            .update(schema.gamesTable)
            .set({ whiteDisconnectedAt: now })
            .where(t.eq(schema.gamesTable.id, game.id));
        } else if (socketInfo.playerId === game.blackPlayerId) {
          await this.db
            .update(schema.gamesTable)
            .set({ blackDisconnectedAt: now })
            .where(t.eq(schema.gamesTable.id, game.id));
        }
      }
    }
  }
}

export default {
  fetch() {
    return new Response("You should not be here.");
  },
};
