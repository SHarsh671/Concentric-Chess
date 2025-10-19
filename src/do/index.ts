import { DurableObject } from "cloudflare:workers";
import { drizzle, DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "./schema";
import { parse } from "cookie";
import * as t from "drizzle-orm";

export class GameObject extends DurableObject<CloudflareEnv> {
  db: DrizzleD1Database<typeof schema>;
  sessions: Map<WebSocket, { playerId: string }>;

  constructor(ctx: DurableObjectState, env: CloudflareEnv) {
    super(ctx, env);
    this.db = drizzle(env.DB, { schema });
    this.sessions = new Map();

    this.ctx.getWebSockets().forEach((ws) => {
      let attachment = ws.deserializeAttachment();
      if (attachment) {
        this.sessions.set(ws, { ...attachment });
      }
    });

    this.ctx.setWebSocketAutoResponse(
      new WebSocketRequestResponsePair("ping", "pong"),
    );
  }

  async fetch(request: Request) {
    const cookie = parse(request.headers.get("Cookie") || "");
    const sessionToken = cookie["session_token"] ?? "";
    const session = await this.db.query.sessionsTable.findFirst({
      where: t.and(
        t.eq(schema.sessionsTable.token, sessionToken),
        t.gt(schema.sessionsTable.expiresAt, new Date().toISOString()),
      ),
    });
    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    const websocketPair = new WebSocketPair();
    const [client, server] = Object.values(websocketPair);

    this.ctx.acceptWebSocket(server);

    server.serializeAttachment({ playerId: session.playerId });
    this.sessions.set(server, { playerId: session.playerId });

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {}

  async webSocketClose(
    ws: WebSocket,
    code: number,
    reason: string,
    wasClean: boolean,
  ) {}
}

export default {
  fetch() {
    return new Response("You should not be here.");
  },
};
