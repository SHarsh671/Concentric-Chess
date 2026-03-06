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
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1); // -1 = starting position
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [autoPlaySpeed, setAutoPlaySpeed] = useState(2000); // 2 seconds per move

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

  // Navigation handlers
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

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left side: Board would go here */}
          <div>
            <Card className="bg-white border-4 border-black">
              <CardHeader className="border-b-4 border-black">
                <CardTitle className="text-2xl font-bold uppercase">
                  Board View
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="aspect-square bg-gray-100 border-4 border-black flex items-center justify-center relative">
                  {/* Your chess board component would go here */}
                  {/* Pass currentMoveIndex to determine which position to show */}
                  <div className="text-center">
                    <p className="text-gray-500 text-lg mb-4">
                      Your circular chess board
                      <br />
                      would render here
                    </p>
                    {currentMoveIndex >= 0 && (
                      <div className="mt-4 p-4 bg-white border-2 border-black inline-block">
                        <p className="font-bold">
                          Move {currentMoveIndex + 1}: {moves[currentMoveIndex].fromSquare} →{" "}
                          {moves[currentMoveIndex].toSquare}
                        </p>
                      </div>
                    )}
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
                    {/* Starting position */}
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

                    {/* All moves */}
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