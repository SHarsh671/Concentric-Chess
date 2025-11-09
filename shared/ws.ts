import { Move } from "./schema";

export type ServerMsg =
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
        from: string;
        to: string;
      };
    }
  | {
      type: "resign";
    };
