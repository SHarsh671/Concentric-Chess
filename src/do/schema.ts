import { sql } from "drizzle-orm";
import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const playersTable = sqliteTable("players", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
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
  variant: text("variant").notNull(),
  whitePlayerId: text("white_player_id").references(() => playersTable.id),
  blackPlayerId: text("black_player_id").references(() => playersTable.id),
  whiteAccepted: int("white_accepted").default(0),
  blackAccepted: int("black_accepted").default(0),
  whiteDisconnectedAt: text("white_disconnected_at"),
  blackDisconnectedAt: text("black_disconnected_at"),
  whiteDrawOffer: int("white_draw_offer").default(0),
  blackDrawOffer: int("black_draw_offer").default(0),
  status: text("status").notNull(),
  nextMove: int("next_move").notNull(),
  lastMoveAt: text("last_move_at").default(sql`CURRENT_TIMESTAMP`),
  whiteTimeLeft: int("white_time_left"),
  blackTimeLeft: int("black_time_left"),
  whiteRatingBefore: int("white_rating_before"),
  whiteRatingChange: int("white_rating_change"),
  blackRatingBefore: int("black_rating_before"),
  blackRatingChange: int("black_rating_change"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
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
