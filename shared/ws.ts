import { Game, Move, Side } from "./schema";

export type ServerMsg =
    | {
        type: "accepted";
        data: {
            whitePlayerId: string | null;
            blackPlayerId: string | null;
        };
    }
    | {
        type: "aborted";
    }
    | {
        type: "move";
        data: {
            move: Move;
            nextMove: number;
            lastMoveAt: string;
            whiteTimeLeft: number | null;
            blackTimeLeft: number | null;
        };
    }
    | {
        type: "game_over";
        data: {
            result:
            | "white_win"
            | "black_win"
            | "draw"
            | "white_resign"
            | "black_resign";
        };
    }
    | {
        type: "draw_offer";
        data: {
            whiteDrawOffer: number;
            blackDrawOffer: number;
        }
    }
    | {
        type: "sync";
        data: {
            game: Game;
            moves: Move[];
        };
    };
export type ClientMsg =
    | {
        type: "move";
        data: {
            side: Side;
            from: string;
            to: string;
        };
    }
    | {
        type: "accept";
    }
    | {
        type: "sync_request";
    }
    | {
        type: "resign";
    }
    | {
        type: "draw";
    }
    | {
        type: "undo";
    }
    ;
