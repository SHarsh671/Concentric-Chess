import { sql } from "drizzle-orm";
import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const playersTable = sqliteTable("players", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  // hashed
  password: text("password").notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const sessionsTable = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  playerId: text("player_id")
    .notNull()
    .references(() => playersTable.id),
  token: text("token").notNull().unique(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  expiresAt: text("expires_at").notNull(),
});

export const gamesTable = sqliteTable("games", {
  id: text("id").primaryKey(),
  // concentric, archimedean
  // then also can do standard, blitz, bullet, etc
  variant: text("variant").notNull(),
  // when searching for an opponent, one of these is NULL (the other is randomly assigned)
  whitePlayerId: text("white_player_id").references(() => playersTable.id),
  blackPlayerId: text("black_player_id").references(() => playersTable.id),
  // when searching, this is automatically set to TRUE once both players have been assigned
  // when one player has been invited by another, this is set to TRUE once both players have accepted
  whiteAccepted: int("white_accepted").default(0),
  blackAccepted: int("black_accepted").default(0),
  // if a player disconnects, this is set
  // if the player reconnects, this is set back to NULL
  // if in matchmaking/waiting for invite acceptance, and a player disconnects, the game is deleted
  whiteDisconnectedAt: text("white_disconnected_at"),
  blackDisconnectedAt: text("black_disconnected_at"),
  // if these are both TRUE, the game is then a draw
  whiteDrawOffer: int("white_draw_offer").default(0),
  blackDrawOffer: int("black_draw_offer").default(0),
  // draw, white_win, black_win, white_resign, black_resign, ongoing
  status: text("status").notNull(),
  // % 2 == 0 -> white to move, % 2 == 1 -> black to move
  nextMove: int("next_move").notNull(),
  lastMoveAt: text("last_move_at").default(sql`CURRENT_TIMESTAMP`),
  // in milliseconds, if NULL then unlimited
  whiteTimeLeft: int("white_time_left"),
  blackTimeLeft: int("black_time_left"),
  whiteRatingBefore: int("white_rating_before"),
  whiteRatingChange: int("white_rating_change"),
  blackRatingBefore: int("black_rating_before"),
  blackRatingChange: int("black_rating_change"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  // this indicates the game has been deleted (this allows us to show what happened if someone does try to accept an invite to a deleted game)
  deletedAt: text("deleted_at"),
});

export const movesTable = sqliteTable("moves", {
  id: text("id").primaryKey(),
  gameId: text("game_id")
    .notNull()
    .references(() => gamesTable.id),
  playerId: text("player_id")
    .notNull()
    .references(() => playersTable.id),
  from_square: text("from_square").notNull(),
  to_square: text("to_square").notNull(),
  promotion: text("promotion"),
  move_number: int("move_number").notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const ratingsTable = sqliteTable("ratings", {
  id: text("id").primaryKey(),
  playerId: text("player_id")
    .notNull()
    .references(() => playersTable.id),
  variant: text("variant").notNull(),
  rating: int("rating").notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export type Player = typeof playersTable.$inferSelect;
export type Session = typeof sessionsTable.$inferSelect;
export type Game = typeof gamesTable.$inferSelect;
export type Move = typeof movesTable.$inferSelect;
export type Rating = typeof ratingsTable.$inferSelect;

export type GameStatus =
  | "draw"
  | "white_win"
  | "black_win"
  | "white_resign"
  | "black_resign"
  | "ongoing";

export type GameVariant =
  // unlimited
  | "concentric-standard"
  // 10m
  | "concentric-rapid"
  // 3m
  | "concentric-blitz"
  // 1m
  | "concentric-bullet";
