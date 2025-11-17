import Image from "next/image";

export type PieceProps = {
  type: string;
  color: string;
  x: number;
  y: number;
};

export default function Piece({ type, color }: PieceProps) {
  return (
    <div>
      <Image
        src={"/pieces/" + type + '-' + color + ".png"}
        alt=""
        width={30}
        height={30}
        onClick={() => console.log("Clicked" + type + color)}
      />
    </div>
  );
}
