"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChevronLeft,
  ChevronRight,
  SkipBack,
  SkipForward,
  Play,
  Pause,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import Board, { CapturedPiece } from "@/components/piece/board";
import Image from "next/image";

// Type based on your database schema
interface Move {
  id: string;
  gameId: string;
  moveNumber: number;
  fromSquare: string;
  toSquare: string;
  promotion: string | null;
  playerId: string;
  createdAt: string | null;
}

interface Game {
  id: string;
  status: string;
  lastMoveAt: string | null;
  whitePlayerId: string | null;
  blackPlayerId: string | null;
  createdAt: string | null;
  variant: string;
  whiteAccepted: number | null;
  blackAccepted: number | null;
  whiteDisconnectedAt: string | null;
  blackDisconnectedAt: string | null;
  deletedAt: string | null;
}

interface GameReplayClientProps {
  game: Game;
  moves: Move[];
  whiteUsername: string;
  blackUsername: string;
}

export default function GameReplayClient({
  game,
  moves,
  whiteUsername,
  blackUsername,
}: GameReplayClientProps) {
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [autoPlaySpeed, setAutoPlaySpeed] = useState(2000);
  const [capturedPieces, setCapturedPieces] = useState<CapturedPiece[]>([]);

  // Get moves up to current index for the board
  const movesUpToCurrent = currentMoveIndex === -1 ? [] : moves.slice(0, currentMoveIndex + 1);

  // Separate captured pieces by color
  const whiteCaptured = capturedPieces.filter((p) => p.color === "wht");
  const blackCaptured = capturedPieces.filter((p) => p.color === "blk");

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying || currentMoveIndex >= moves.length - 1) {
      setIsAutoPlaying(false);
      return;
    }

    const timer = setTimeout(() => {
      setCurrentMoveIndex((prev) => prev + 1);
    }, autoPlaySpeed);

    return () => clearTimeout(timer);
  }, [isAutoPlaying, currentMoveIndex, moves.length, autoPlaySpeed]);

  const handleFirst = () => {
    setCurrentMoveIndex(-1);
    setIsAutoPlaying(false);
  };

  const handlePrevious = () => {
    if (currentMoveIndex > -1) {
      setCurrentMoveIndex((prev) => prev - 1);
      setIsAutoPlaying(false);
    }
  };

  const handleNext = () => {
    if (currentMoveIndex < moves.length - 1) {
      setCurrentMoveIndex((prev) => prev + 1);
    }
  };

  const handleLast = () => {
    setCurrentMoveIndex(moves.length - 1);
    setIsAutoPlaying(false);
  };

  const handleJumpToMove = (index: number) => {
    setCurrentMoveIndex(index);
    setIsAutoPlaying(false);
  };

  const toggleAutoPlay = () => {
    if (currentMoveIndex >= moves.length - 1) {
      handleFirst();
      setTimeout(() => setIsAutoPlaying(true), 100);
    } else {
      setIsAutoPlaying(!isAutoPlaying);
    }
  };

  const getCurrentPlayer = () => {
    if (currentMoveIndex === -1) return "White to move";
    const moveNum = moves[currentMoveIndex].moveNumber;
    return moveNum % 2 === 1 ? "White" : "Black";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/history"
            className="inline-flex items-center gap-2 text-sm font-medium hover:underline mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to History
          </Link>
          <div className="bg-white border-4 border-black p-6">
            <h1 className="text-3xl font-bold text-black mb-2">GAME REPLAY</h1>
            <div className="flex items-center justify-between">
              <div className="text-lg">
                <span className="font-bold">{whiteUsername}</span>
                <span className="mx-2">vs</span>
                <span className="font-bold">{blackUsername}</span>
              </div>
              <div className="text-sm font-medium px-4 py-2 bg-black text-white border-2 border-black uppercase">
                {game.status}
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[140px_1fr_1fr] gap-6">
          {/* Left sidebar: Captured Pieces */}
          <div className="w-[140px] border-4 border-black bg-white rounded-lg p-3 flex flex-col h-[900px] shrink-0">
            <div className="text-sm font-bold mb-3 uppercase text-center border-b-2 border-black pb-2">
              Captured
              <br />
              Pieces
            </div>

            <div className="flex-1 overflow-y-auto space-y-4">
              {/* White captured */}
              <div>
                <div className="text-xs font-bold text-gray-600 mb-1 text-center">
                  White ♔
                </div>
                <div className="flex flex-col gap-1 items-center">
                  {whiteCaptured.length === 0 ? (
                    <span className="text-xs text-gray-400 italic">None</span>
                  ) : (
                    whiteCaptured.map((piece, idx) => (
                      <div
                        key={`white-${piece.type}-${idx}`}
                        className="animate-slide-in"
                        style={{ animationDelay: `${idx * 0.1}s` }}
                      >
                        <img
                          src={`/pieces/${piece.type}-${piece.color}.png`}
                          alt={`${piece.color} ${piece.type}`}
                          className="w-14 h-14 opacity-80"
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t-2 border-gray-300"></div>

              {/* Black captured */}
              <div>
                <div className="text-xs font-bold text-gray-600 mb-1 text-center">
                  Black ♚
                </div>
                <div className="flex flex-col gap-1 items-center">
                  {blackCaptured.length === 0 ? (
                    <span className="text-xs text-gray-400 italic">None</span>
                  ) : (
                    blackCaptured.map((piece, idx) => (
                      <div
                        key={`black-${piece.type}-${idx}`}
                        className="animate-slide-in"
                        style={{ animationDelay: `${idx * 0.1}s` }}
                      >
                        <img
                          src={`/pieces/${piece.type}-${piece.color}.png`}
                          alt={`${piece.color} ${piece.type}`}
                          className="w-14 h-14 opacity-80"
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Middle: Board */}
          <div>
            <Card className="bg-white border-4 border-black">
              <CardContent className="p-4">
                <div className="relative w-[900px] h-[900px]">
                  <Image
                    src="/cc/ccboard.png"
                    alt="Chess board"
                    width={900}
                    height={900}
                    className="absolute top-0 left-0"
                    priority
                  />
                  <div className="absolute top-0 left-0 w-full h-full">
                    <Board
                      moves={movesUpToCurrent}
                      onMove={() => {}}
                      onCapturedPiecesChange={setCapturedPieces}
                      isReplayMode={true}
                    />
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-600">
                    {currentMoveIndex === -1
                      ? "Starting Position"
                      : `After move ${currentMoveIndex + 1} of ${moves.length}`}
                  </p>
                  <p className="font-bold mt-2">{getCurrentPlayer()}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right side: Replay controls */}
          <div className="space-y-6">
            {/* Control Panel */}
            <Card className="bg-white border-4 border-black">
              <CardHeader className="border-b-4 border-black">
                <CardTitle className="text-2xl font-bold uppercase">Controls</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-bold">
                    <span>
                      MOVE {currentMoveIndex + 1} / {moves.length}
                    </span>
                    <span>{Math.round(((currentMoveIndex + 1) / moves.length) * 100)}%</span>
                  </div>
                  <div className="w-full h-4 bg-gray-200 border-4 border-black">
                    <div
                      className="h-full bg-black transition-all duration-300"
                      style={{
                        width: `${((currentMoveIndex + 1) / moves.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Playback Speed */}
                <div className="space-y-2">
                  <label className="text-sm font-bold uppercase">Playback Speed</label>
                  <div className="flex gap-2">
                    {[
                      { label: "0.5x", value: 4000 },
                      { label: "1x", value: 2000 },
                      { label: "2x", value: 1000 },
                      { label: "4x", value: 500 },
                    ].map(({ label, value }) => (
                      <Button
                        key={label}
                        onClick={() => setAutoPlaySpeed(value)}
                        variant={autoPlaySpeed === value ? "default" : "outline"}
                        className={
                          autoPlaySpeed === value
                            ? "bg-black text-white border-2 border-black"
                            : "bg-white text-black border-2 border-black hover:bg-gray-100"
                        }
                        size="sm"
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Control Buttons */}
                <div className="flex items-center justify-center gap-2">
                  <Button
                    onClick={handleFirst}
                    disabled={currentMoveIndex === -1}
                    variant="outline"
                    size="icon"
                    className="border-4 border-black hover:bg-gray-100 disabled:opacity-30"
                  >
                    <SkipBack className="h-4 w-4" />
                  </Button>

                  <Button
                    onClick={handlePrevious}
                    disabled={currentMoveIndex === -1}
                    variant="outline"
                    size="icon"
                    className="border-4 border-black hover:bg-gray-100 disabled:opacity-30"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <Button
                    onClick={toggleAutoPlay}
                    className="bg-black text-white hover:bg-gray-800 border-4 border-black px-8 font-bold"
                  >
                    {isAutoPlaying ? (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        PAUSE
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        PLAY
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={handleNext}
                    disabled={currentMoveIndex >= moves.length - 1}
                    variant="outline"
                    size="icon"
                    className="border-4 border-black hover:bg-gray-100 disabled:opacity-30"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>

                  <Button
                    onClick={handleLast}
                    disabled={currentMoveIndex >= moves.length - 1}
                    variant="outline"
                    size="icon"
                    className="border-4 border-black hover:bg-gray-100 disabled:opacity-30"
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </div>

                {/* Current Move Display */}
                {currentMoveIndex >= 0 && (
                  <div className="p-4 bg-gray-50 border-4 border-black">
                    <div className="text-sm font-bold text-gray-600 mb-1 uppercase">
                      Current Move:
                    </div>
                    <div className="text-2xl font-bold">
                      {moves[currentMoveIndex].moveNumber}.{" "}
                      {moves[currentMoveIndex].fromSquare} → {moves[currentMoveIndex].toSquare}
                      {moves[currentMoveIndex].promotion &&
                        ` =${moves[currentMoveIndex].promotion}`}
                    </div>
                    <div className="text-sm text-gray-600 mt-2">
                      Player: {getCurrentPlayer()}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Move List */}
            <Card className="bg-white border-4 border-black">
              <CardHeader className="border-b-4 border-black">
                <CardTitle className="text-xl font-bold uppercase">Move History</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-96 overflow-y-auto">
                  <div className="p-2 space-y-1">
                    <button
                      onClick={() => handleJumpToMove(-1)}
                      className={`w-full text-left p-3 border-2 font-bold transition-colors ${
                        currentMoveIndex === -1
                          ? "bg-black text-white border-black"
                          : "bg-white border-gray-300 hover:bg-gray-100"
                      }`}
                    >
                      Starting Position
                    </button>

                    {moves.map((move, index) => (
                      <button
                        key={move.id}
                        onClick={() => handleJumpToMove(index)}
                        className={`w-full text-left p-3 border-2 transition-colors ${
                          currentMoveIndex === index
                            ? "bg-black text-white border-black"
                            : "bg-white border-gray-300 hover:bg-gray-100"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold">{move.moveNumber}.</span>
                          <span className="flex-1 ml-3">
                            {move.fromSquare} → {move.toSquare}
                            {move.promotion && ` =${move.promotion}`}
                          </span>
                          <span className="text-sm opacity-70">
                            {move.moveNumber % 2 === 1 ? "White" : "Black"}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}