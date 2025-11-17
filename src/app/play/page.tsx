"use client";

//used this page just for developing. this page should probably be actual ui and the board/games will be different page. sorry in advance.

import Board from "@/components/piece/board";
import Image from "next/image";

export default function PlayPage() {
  return <div className="relative w-[1700px] h-[1700px]">
    <Image 
      src="/cc/ccboard.png"
      alt=""
      width={1700}
      height={1700}
    />
    <Board></Board>
  </div>
}