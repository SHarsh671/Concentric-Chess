"use client";

import { useState, useEffect } from "react";
import Board, { CapturedPiece } from "@/components/piece/board";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Play,
  Pause,
} from "lucide-react";

interface TestMove {
  id: string;
  gameId: string;
  playerId: string;
  fromSquare: string;
  toSquare: string;
  moveNumber: number;
  promotion: null;
  createdAt: string;
}

export default function TestReplayPage() {
  // Phase 1: record moves
  const [recordedMoves, setRecordedMoves] = useState<TestMove[]>([]);
  const [moveCount, setMoveCount] = useState(1);
  const [isRecording, setIsRecording] = useState(true);

  // Phase 2: replay
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [capturedPieces, setCapturedPieces] = useState<CapturedPiece[]>([]);

  // Auto-play
  useEffect(() => {
    if (!isPlaying) return;
    if (stepIndex >= recordedMoves.length) {
      setIsPlaying(false);
      return;
    }
    const t = setTimeout(() => setStepIndex((s) => s + 1), 1000);
    return () => clearTimeout(t);
  }, [isPlaying, stepIndex, recordedMoves.length]);

  const handleRecordMove = (from: string, to: string) => {
    const move: TestMove = {
      id: `move-${moveCount}`,
      gameId: "test-replay",
      playerId: "tester",
      fromSquare: from,
      toSquare: to,
      moveNumber: moveCount,
      promotion: null,
      createdAt: new Date().toISOString(),
    };
    setRecordedMoves((prev) => [...prev, move]);
    setMoveCount((prev) => prev + 1);
  };

  const startReplay = () => {
    setIsRecording(false);
    setStepIndex(0);
    setIsPlaying(false);
  };

  const goTo = (idx: number) =>
    setStepIndex(Math.max(0, Math.min(recordedMoves.length, idx)));

  const visibleMoves = recordedMoves.slice(0, stepIndex);
  const whiteCaptured = capturedPieces.filter((p) => p.color === "wht");
  const blackCaptured = capturedPieces.filter((p) => p.color === "blk");

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          Test Replay{" "}
          <span
            className={`text-sm font-normal px-2 py-1 rounded ${
              isRecording
                ? "bg-red-100 text-red-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {isRecording ? "● Recording" : "▶ Replaying"}
          </span>
        </h1>
        <div className="flex gap-2">
          {isRecording ? (
            <Button
              onClick={startReplay}
              disabled={recordedMoves.length === 0}
              className="bg-red-600 hover:bg-green-700 text-white"
            >
              Start Replay ({recordedMoves.length} moves)
            </Button>
          ) : (
            <Button
              onClick={() => {
                setIsRecording(true);
                setRecordedMoves([]);
                setMoveCount(1);
                setStepIndex(0);
                setIsPlaying(false);
              }}
              variant="outline"
              className="border-red-400 text-red-600 hover:bg-red-50"
            >
              Reset & Re-record
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-4">
        {/* Captured pieces sidebar */}
        <div className="w-[120px] border-4 border-black bg-white rounded-lg p-2 flex flex-col h-[900px] shrink-0">
          <div className="text-xs font-bold mb-2 uppercase text-center border-b-2 border-black pb-1">
            Captured
          </div>
          <div className="flex-1 overflow-y-auto space-y-3">
            <div>
              <div className="text-xs text-gray-500 text-center mb-1">
                White ♔
              </div>
              {whiteCaptured.length === 0 ? (
                <p className="text-xs text-gray-400 italic text-center">—</p>
              ) : (
                whiteCaptured.map((p, i) => (
                  <img
                    key={i}
                    src={`/pieces/${p.type}-${p.color}.png`}
                    className="w-12 h-12 mx-auto opacity-80"
                    alt={`${p.color} ${p.type}`}
                  />
                ))
              )}
            </div>
            <div className="border-t border-gray-200" />
            <div>
              <div className="text-xs text-gray-500 text-center mb-1">
                Black ♚
              </div>
              {blackCaptured.length === 0 ? (
                <p className="text-xs text-gray-400 italic text-center">—</p>
              ) : (
                blackCaptured.map((p, i) => (
                  <img
                    key={i}
                    src={`/pieces/${p.type}-${p.color}.png`}
                    className="w-12 h-12 mx-auto opacity-80"
                    alt={`${p.color} ${p.type}`}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Board */}
        <div className="flex flex-col gap-3">
          <div className="relative w-[900px] h-[900px] border-2 shadow-lg">
            <Image
              src="/cc/ccboard.png"
              alt="Chess board"
              width={900}
              height={900}
              className="absolute top-0 left-0"
              priority
            />
            <div className="absolute top-0 left-0 w-full h-full">
              {/* <Board */}
              {/*   moves={isRecording ? recordedMoves : visibleMoves} */}
              {/*   onMove={isRecording ? handleRecordMove : () => {}} */}
              {/*   onCapturedPiecesChange={setCapturedPieces} */}
              {/*   isReplayMode={!isRecording} */}
              {/* /> */}
            </div>
          </div>

          {/* Replay controls — only shown in replay mode */}
          {!isRecording && (
            <div className="flex items-center gap-3 justify-center bg-gray-50 border-2 rounded-lg p-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  goTo(0);
                  setIsPlaying(false);
                }}
              >
                <ChevronsLeft size={18} />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  goTo(stepIndex - 1);
                  setIsPlaying(false);
                }}
              >
                <ChevronLeft size={18} />
              </Button>
              <Button
                onClick={() => setIsPlaying((p) => !p)}
                className="px-6 bg-black text-white hover:bg-gray-800"
              >
                {isPlaying ? (
                  <>
                    <Pause size={16} className="mr-1" /> Pause
                  </>
                ) : (
                  <>
                    <Play size={16} className="mr-1" /> Play
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  goTo(stepIndex + 1);
                  setIsPlaying(false);
                }}
              >
                <ChevronRight size={18} />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  goTo(recordedMoves.length);
                  setIsPlaying(false);
                }}
              >
                <ChevronsRight size={18} />
              </Button>
              <span className="text-sm text-gray-600 ml-2">
                Move {stepIndex} / {recordedMoves.length}
              </span>
            </div>
          )}

          {/* Recording hint */}
          {isRecording && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 text-sm text-red-700 max-w-[900px]">
              <p className="font-semibold mb-1">
                ● Recording mode — play a game normally
              </p>
              <p>
                When done, click <strong>Start Replay</strong> to step through
                your moves.
              </p>
            </div>
          )}
        </div>

        {/* Move list */}
        <div className="w-[200px] border-2 rounded-lg overflow-y-auto max-h-[900px] bg-white shrink-0">
          <div className="p-2 border-b font-semibold text-sm sticky top-0 bg-white">
            {isRecording ? "Recorded Moves" : "Move List"}
          </div>
          <div className="flex flex-col p-1">
            {!isRecording && (
              <button
                onClick={() => {
                  goTo(0);
                  setIsPlaying(false);
                }}
                className={`text-left text-sm px-2 py-1 rounded mb-1 ${
                  stepIndex === 0
                    ? "bg-yellow-200 font-semibold"
                    : "hover:bg-gray-100"
                }`}
              >
                Start
              </button>
            )}
            {recordedMoves.map((m, idx) => {
              const turn = Math.floor(idx / 2) + 1;
              const mover = idx % 2 === 0 ? "w" : "b";
              const isCurrent = !isRecording && idx === stepIndex - 1;
              const isPast = !isRecording && idx < stepIndex;
              return (
                <button
                  key={m.id}
                  onClick={() => !isRecording && goTo(idx + 1)}
                  className={`text-left text-sm px-2 py-1 rounded transition-colors ${
                    isCurrent
                      ? "bg-yellow-200 font-semibold"
                      : isPast
                      ? "text-gray-800 hover:bg-gray-100"
                      : isRecording
                      ? "text-gray-700"
                      : "text-gray-400 hover:bg-gray-50"
                  }`}
                >
                  {turn}
                  {mover}. {m.fromSquare}–{m.toSquare}
                </button>
              );
            })}
            {recordedMoves.length === 0 && (
              <p className="text-xs text-gray-400 italic p-2">No moves yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
