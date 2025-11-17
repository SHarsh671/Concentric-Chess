import Image from "next/image";

export type PieceProps = {
  className?: string;
  type: string;
  color: string;
  sq: string;
};

export default function Piece({ type, color, className }: PieceProps) {
  return (<>
    <Image
      className={className}
      src={"/pieces/" + type + '-' + color + ".png"}
      alt=""
      width={64}
      height={64}
      // onClick={() => console.log('')}
    />
  </>
  );
}