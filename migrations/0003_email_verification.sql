-- Migration number: 0003 	 2026-09-16
ALTER TABLE players ADD COLUMN email_verified_at timestamp NULL;

CREATE TABLE email_verification_tokens (
    id text PRIMARY KEY,
    player_id text NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    token text UNIQUE NOT NULL,
    -- the email this token verifies; changing email invalidates old tokens' effect
    email text NOT NULL,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    expires_at timestamp NOT NULL,
    used_at timestamp NULL
);

CREATE INDEX idx_email_verification_tokens_player_id
    ON email_verification_tokens(player_id);
