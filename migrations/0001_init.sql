-- Migration number: 0001 	 2025-10-18T18:54:20.846Z
CREATE TABLE players (
    id text PRIMARY KEY,
    username text UNIQUE NOT NULL,
    email text UNIQUE NOT NULL,
    -- hashed
    password text NOT NULL,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sessions (
    id text PRIMARY KEY,
    token text UNIQUE NOT NULL,
    player_id text REFERENCES players(id) ON DELETE CASCADE,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    expires_at timestamp NOT NULL
);

CREATE TABLE games (
    id text PRIMARY KEY,
    -- concentric, archimedean
    -- then also can do standard, blitz, bullet, etc
    variant text NOT NULL,
    -- when searching for an opponent, one of these is NULL (the other is randomly assigned)
    white_player_id text REFERENCES players(id) ON DELETE SET NULL,
    black_player_id text REFERENCES players(id) ON DELETE SET NULL,
    -- when searching, this is automatically set to TRUE once both players have been assigned
    -- when one player has been invited by another, this is set to TRUE once both players have accepted
    white_accepted boolean DEFAULT FALSE,
    black_accepted boolean DEFAULT FALSE,
    -- if a player disconnects, this is set
    -- if the player reconnects, this is set back to NULL
    -- if in matchmaking/waiting for invite acceptance and a player disconnects, the game is deleted
    white_disconnected_at timestamp NULL,
    black_disconnected_at timestamp NULL,
    -- if these are both TRUE, the game is then a draw
    white_draw_offer boolean DEFAULT FALSE,
    black_draw_offer boolean DEFAULT FALSE,
    -- draw, white_win, black_win, white_resign, black_resign, ongoing
    status text NOT NULL,
    -- % 2 == 0 -> white to move, % 2 == 1 -> black to move
    next_move integer NOT NULL,
    last_move_at timestamp DEFAULT CURRENT_TIMESTAMP,
    -- in milliseconds, if NULL then unlimited
    white_time_left integer NULL,
    black_time_left integer NULL,
    white_rating_before integer NULL,
    white_rating_change integer NULL,
    black_rating_before integer NULL,
    black_rating_change integer NULL,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    -- this indicates the game has been deleted (this allows us to show what happened if someone does try to accept an invite to a deleted game)
    deleted_at timestamp NULL
);

CREATE TABLE moves (
    id text PRIMARY KEY,
    game_id text REFERENCES games(id) ON DELETE CASCADE,
    player_id text REFERENCES players(id) ON DELETE CASCADE,
    from_square text NOT NULL,
    to_square text NOT NULL,
    promotion text NULL,
    move_number integer NOT NULL,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ratings (
    id text PRIMARY KEY,
    player_id text REFERENCES players(id) ON DELETE CASCADE,
    variant text NOT NULL,
    rating integer NOT NULL,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(player_id, variant)
);
