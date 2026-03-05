import Image from "next/image";

export type PieceProps = {
  className?: string;
  type: string;
  color: string;
  position: string; // e.g., "r1c1"
  x?: number;
  y?: number;
  onClick?: () => void;
  isSelected?: boolean;
  variant: "concentric" | "archimedean";
};

export default function Piece({
  type,
  color,
  x = 0,
  y = 0,
  onClick,
  isSelected,
  position,
  variant,
}: PieceProps) {
  // Scale factor to match the 900px board size
  const scaleFactor = 900 / 1730;
  const scaledX = x * scaleFactor;
  const scaledY = y * scaleFactor;

  return (
    <div
      className={`absolute cursor-pointer transition-all duration-200 size-piece select-none ${variant === "concentric" ? position : position.concat("a")}`}
      style={{
        // left: `${scaledX}px`,
        // top: `${scaledY}px`,
        // transform: 'translate(-50%, -50%)',
        // zIndex: 10,
        filter: isSelected ? "drop-shadow(0 0 10px yellow)" : "none",
        scale: isSelected ? "1.1" : "1",
        pointerEvents: 'none',
      }
      }
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      <Image
        src={`/pieces/${type}-${color}.png`}
        alt={`${color} ${type}`}
        width={64}
        height={64}
        className={`pointer-events-none`}
        // className={`pointer-events-none size-piece absolute ${position}`}
        draggable={false}
      />
    </div >
  );
}
