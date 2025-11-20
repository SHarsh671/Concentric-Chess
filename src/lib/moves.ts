import { db } from "./db";
import { movesTable } from "../../shared/schema";
import { eq } from "drizzle-orm";

type RecordMoveArgs = {
  gameId: string;
  playerId: string;
  from: string;
  to: string;
  moveNumber: number;
  promotion?: string | null;
};

export async function recordMove({
  gameId,
  playerId,
  from,
  to,
  moveNumber,
  promotion,
}: RecordMoveArgs) {
  const database = db();

  await database.insert(movesTable).values({
    id: crypto.randomUUID(),
    gameId,
    playerId,
    from_square: from,
    to_square: to,
    promotion: promotion ?? null,
    move_number: moveNumber,
  });
}

export async function getMovesForGame(gameId: string) {
  const database = db();

  return database
    .select()
    .from(movesTable)
    .where(eq(movesTable.gameId, gameId))
    .orderBy(movesTable.move_number);
}