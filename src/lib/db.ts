import "server-only";

import { drizzle, DrizzleD1Database } from "drizzle-orm/d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import * as schema from "./schema";

let _db: DrizzleD1Database<typeof schema> | null = null;

export function db(dbInstance?: D1Database): DrizzleD1Database<typeof schema> {
  if (!_db) {
    _db = drizzle(dbInstance ?? getCloudflareContext().env.DB, { schema });
  }
  return _db;
}
