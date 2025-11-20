import { Move, Side } from "./schema";

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
      data: Move;
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
      type: "resign";
    }
  | {
      type: "accept";
    };
