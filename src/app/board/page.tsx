"use client";

//used this page just for developing. this page should probably be actual ui and the board/games will be different page. sorry in advance.

import Board from "@/components/piece/board";
import Image from "next/image";
import Piece from "@/components/piece/piece";

export default function PlayPage() {
  return (
    <div className="relative w-[1700px] h-[1700px] border-2">
      {/* Background board image */}
      <Image
        src="/cc/ccboard.png"
        alt="Chess board"
        width={1700}
        height={1700}
        className="absolute top-0 left-0"
        priority
      />

      {/* Overlay: SVG cells + pieces */}
      <div className="absolute top-0 left-0 w-full h-full">
        <Board />
      </div>
    </div>
  );
}
