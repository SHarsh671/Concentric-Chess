import { GameVariant } from "./schema";

export function startingTime(variant: GameVariant): number | null {
  switch (variant) {
    case "concentric-unlimited":
      return null;
    case "concentric-rapid":
      return 10 * 60 * 1000;
    case "concentric-blitz":
      return 3 * 60 * 1000;
    case "concentric-bullet":
      return 1 * 60 * 1000;
    case "archimedean-unlimited":
      return null;
    case "archimedean-rapid":
      return 10 * 60 * 1000;
    case "archimedean-blitz":
      return 3 * 60 * 1000;
    case "archimedean-bullet":
      return 1 * 60 * 1000;
    default:
      throw new Error("Invalid game variant");
  }
}
