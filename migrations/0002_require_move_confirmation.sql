-- Migration number: 0002 	 2026-04-07
ALTER TABLE players ADD COLUMN require_move_confirmation integer NOT NULL DEFAULT 1;
