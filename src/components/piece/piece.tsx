import Image from "next/image";

export type PieceProps = {
  type: string;
  color: string;
  position: string; // e.g., "r1c1"
  x?: number;
  y?: number;
  onClick?: () => void;
  isSelected?: boolean;
};

export default function Piece({ type, color, x = 0, y = 0, onClick, isSelected }: PieceProps) {
  return (
    <div
      className="absolute pointer-events-auto cursor-pointer transition-all duration-200"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: 'translate(-50%, -50%)',
        zIndex: 10,
        filter: isSelected ? 'drop-shadow(0 0 10px yellow)' : 'none',
        scale: isSelected ? '1.1' : '1'
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      <Image
        src={`/pieces/${type}-${color}.png`}
        alt={`${color} ${type}`}
        width={40}
        height={40}
        className="pointer-events-none"
        draggable={false}
      />
    </div>
  );
}