-- Migration number: 0004 	 2026-09-16
CREATE TABLE password_reset_tokens (
    id text PRIMARY KEY,
    player_id text NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    token text UNIQUE NOT NULL,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    expires_at timestamp NOT NULL,
    used_at timestamp NULL
);

CREATE INDEX idx_password_reset_tokens_player_id
    ON password_reset_tokens(player_id);
