import { movesTable } from "./schema";
import { eq } from "drizzle-orm";

type RecordMoveArgs = {
  gameId: string;
  playerId: string;
  from: string;
  to: string;
  moveNumber: number;
  promotion?: string | null;
};

export async function recordMove(
  db: any,
  { gameId, playerId, from, to, moveNumber, promotion }: RecordMoveArgs,
): Promise<string> {
  const id = crypto.randomUUID();
  await db.insert(movesTable).values({
    id,
    gameId,
    playerId,
    fromSquare: from,
    toSquare: to,
    promotion: promotion ?? null,
    moveNumber: moveNumber,
  });
  return id;
}

export async function getMovesForGame(db: any, gameId: string) {
  return db
    .select()
    .from(movesTable)
    .where(eq(movesTable.gameId, gameId))
    .orderBy(movesTable.moveNumber);
}
