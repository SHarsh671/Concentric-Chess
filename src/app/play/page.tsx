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

      {/* example pieces for all the squares on the borad */}
      {/* <Piece className="absolute r12c1 size-piece pointer-events-none" type="rook" color="blk" sq="r12c1"/>

    <Piece className="absolute r11c1 size-piece pointer-events-none" type="queen" color="blk" sq="r11c1"/>
    <Piece className="absolute r11c2 size-piece pointer-events-none" type="rook" color="blk" sq="r11c2"/>
    <Piece className="absolute r11c3 size-piece pointer-events-none" type="king" color="blk" sq="r11c3"/>

    <Piece className="absolute r10c1 size-piece pointer-events-none" type="knight" color="blk" sq="r10c1"/>
    <Piece className="absolute r10c2 size-piece pointer-events-none" type="bishop" color="blk" sq="r10c2"/>
    <Piece className="absolute r10c3 size-piece pointer-events-none" type="prince" color="wht" sq="r10c3"/>
    <Piece className="absolute r10c4 size-piece pointer-events-none" type="bishop" color="blk" sq="r10c4"/>
    <Piece className="absolute r10c5 size-piece pointer-events-none" type="knight" color="blk" sq="r10c5"/>

    <Piece className="absolute r9c1 size-piece pointer-events-none" type="pawn" color="blk" sq="r9c1"/>
    <Piece className="absolute r9c2 size-piece pointer-events-none" type="pawn" color="blk" sq="r9c2"/>
    <Piece className="absolute r9c3 size-piece pointer-events-none" type="pawn" color="blk" sq="r9c3"/>
    <Piece className="absolute r9c4 size-piece pointer-events-none" type="pawn" color="blk" sq="r9c4"/>
    <Piece className="absolute r9c5 size-piece pointer-events-none" type="pawn" color="blk" sq="r9c5"/>
    <Piece className="absolute r9c6 size-piece pointer-events-none" type="pawn" color="blk" sq="r9c6"/>
    <Piece className="absolute r9c7 size-piece pointer-events-none" type="pawn" color="blk" sq="r9c7"/>

    <Piece className="absolute r8c1 size-piece pointer-events-none" type="knight" color="blk" sq="r8c1"/>
    <Piece className="absolute r8c2 size-piece pointer-events-none" type="knight" color="blk" sq="r8c2"/>
    <Piece className="absolute r8c3 size-piece pointer-events-none" type="knight" color="blk" sq="r8c3"/>
    <Piece className="absolute r8c4 size-piece pointer-events-none" type="knight" color="blk" sq="r8c4"/>
    <Piece className="absolute r8c5 size-piece pointer-events-none" type="knight" color="blk" sq="r8c5"/>
    <Piece className="absolute r8c6 size-piece pointer-events-none" type="knight" color="blk" sq="r8c6"/>
    <Piece className="absolute r8c7 size-piece pointer-events-none" type="knight" color="blk" sq="r8c7"/>
    <Piece className="absolute r8c8 size-piece pointer-events-none" type="knight" color="blk" sq="r8c8"/>
    <Piece className="absolute r8c9 size-piece pointer-events-none" type="knight" color="blk" sq="r8c9"/>

    <Piece className="absolute r7c1 size-piece pointer-events-none" type="knight" color="blk" sq="r7c1"/>
    <Piece className="absolute r7c2 size-piece pointer-events-none" type="knight" color="blk" sq="r7c2"/>
    <Piece className="absolute r7c3 size-piece pointer-events-none" type="knight" color="blk" sq="r7c3"/>
    <Piece className="absolute r7c4 size-piece pointer-events-none" type="knight" color="blk" sq="r7c4"/>
    <Piece className="absolute r7c5 size-piece pointer-events-none" type="knight" color="blk" sq="r7c5"/>
    <Piece className="absolute r7c6 size-piece pointer-events-none" type="knight" color="blk" sq="r7c6"/>
    <Piece className="absolute r7c7 size-piece pointer-events-none" type="knight" color="blk" sq="r7c7"/>
    <Piece className="absolute r7c8 size-piece pointer-events-none" type="knight" color="blk" sq="r7c8"/>
    <Piece className="absolute r7c9 size-piece pointer-events-none" type="knight" color="blk" sq="r7c9"/>
    <Piece className="absolute r7c10 size-piece pointer-events-none" type="knight" color="blk" sq="r7c10"/>
    <Piece className="absolute r7c11 size-piece pointer-events-none" type="knight" color="blk" sq="r7c11"/>

    <Piece className="absolute r6c1 size-piece pointer-events-none" type="knight" color="blk" sq="r6c1"/>
    <Piece className="absolute r6c2 size-piece pointer-events-none" type="knight" color="blk" sq="r6c2"/>
    <Piece className="absolute r6c3 size-piece pointer-events-none" type="knight" color="blk" sq="r6c3"/>
    <Piece className="absolute r6c4 size-piece pointer-events-none" type="knight" color="blk" sq="r6c4"/>
    <Piece className="absolute r6c5 size-piece pointer-events-none" type="knight" color="blk" sq="r6c5"/>
    <Piece className="absolute r6c6 size-piece pointer-events-none" type="knight" color="blk" sq="r6c6"/>
    <Piece className="absolute r6c7 size-piece pointer-events-none" type="knight" color="blk" sq="r6c7"/>
    <Piece className="absolute r6c8 size-piece pointer-events-none" type="knight" color="blk" sq="r6c8"/>
    <Piece className="absolute r6c9 size-piece pointer-events-none" type="knight" color="blk" sq="r6c9"/>
    <Piece className="absolute r6c10 size-piece pointer-events-none" type="knight" color="blk" sq="r6c10"/>
    <Piece className="absolute r6c11 size-piece pointer-events-none" type="knight" color="blk" sq="r6c11"/> 
  
    <Piece className="absolute r5c1 size-piece pointer-events-none" type="knight" color="blk" sq="r5c1"/>
    <Piece className="absolute r5c2 size-piece pointer-events-none" type="knight" color="blk" sq="r5c2"/>
    <Piece className="absolute r5c3 size-piece pointer-events-none" type="knight" color="blk" sq="r5c3"/>
    <Piece className="absolute r5c4 size-piece pointer-events-none" type="knight" color="blk" sq="r5c4"/>
    <Piece className="absolute r5c5 size-piece pointer-events-none" type="knight" color="blk" sq="r5c5"/>
    <Piece className="absolute r5c6 size-piece pointer-events-none" type="knight" color="blk" sq="r5c6"/>
    <Piece className="absolute r5c7 size-piece pointer-events-none" type="knight" color="blk" sq="r5c7"/>
    <Piece className="absolute r5c8 size-piece pointer-events-none" type="knight" color="blk" sq="r5c8"/>
    <Piece className="absolute r5c9 size-piece pointer-events-none" type="knight" color="blk" sq="r5c9"/>

    <Piece className="absolute r4c1 size-piece pointer-events-none" type="pawn" color="wht" sq="r4c1"/>
    <Piece className="absolute r4c2 size-piece pointer-events-none" type="pawn" color="wht" sq="r4c2"/>
    <Piece className="absolute r4c3 size-piece pointer-events-none" type="pawn" color="wht" sq="r4c3"/>
    <Piece className="absolute r4c4 size-piece pointer-events-none" type="pawn" color="wht" sq="r4c4"/>
    <Piece className="absolute r4c5 size-piece pointer-events-none" type="pawn" color="wht" sq="r4c5"/>
    <Piece className="absolute r4c6 size-piece pointer-events-none" type="pawn" color="wht" sq="r4c6"/>
    <Piece className="absolute r4c7 size-piece pointer-events-none" type="pawn" color="wht" sq="r4c7"/>

    <Piece className="absolute r3c1 size-piece pointer-events-none" type="knight" color="wht" sq="r3c1"/>
    <Piece className="absolute r3c2 size-piece pointer-events-none" type="bishop" color="wht" sq="r3c2"/>
    <Piece className="absolute r3c3 size-piece pointer-events-none" type="prince" color="blk" sq="r3c3"/>
    <Piece className="absolute r3c4 size-piece pointer-events-none" type="bishop" color="wht" sq="r3c4"/>
    <Piece className="absolute r3c5 size-piece pointer-events-none" type="knight" color="wht" sq="r3c5"/>

    <Piece className="absolute r2c1 size-piece pointer-events-none" type="queen" color="wht" sq="r2c1"/>
    <Piece className="absolute r2c2 size-piece pointer-events-none" type="rook" color="wht" sq="r2c2"/>
    <Piece className="absolute r2c3 size-piece pointer-events-none" type="king" color="wht" sq="r2c3"/> 

    <Piece className="absolute r1c1 size-piece pointer-events-none" type="rook" color="wht" sq="r1c1"/>     */}
    </div>
  );
}
