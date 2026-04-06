"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import {
  getBoardStatus,
  getState,
  startingTime,
  updateStateWithMove,
} from "shared/rules";
import { GameVariant } from "shared";
import { pieceLabel, toNotation } from "@/lib/utils";
import { PieceType, Side } from "shared/graph";

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
  whiteTimeLeft: number | null;
  blackTimeLeft: number | null;
}

interface GameReplayClientProps {
  game: Game;
  moves: Move[];
  whiteUsername: string;
  blackUsername: string;
}

function parseTimestamp(value: string | null | undefined): number | null {
  if (!value) return null;
  const ts = Date.parse(value);
  return Number.isNaN(ts) ? null : ts;
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

  const baseClock = useMemo(
    () => startingTime(game.variant as never),
    [game.variant],
  );

  const replayClocks = useMemo(() => {
    const initial: [number | null, number | null] = [baseClock, baseClock];
    if (baseClock === null) {
      return {
        initial,
        snapshots: moves.map(
          () => [null, null] as [number | null, number | null],
        ),
      };
    }

    let whiteTime = baseClock;
    let blackTime = baseClock;
    let previousTs =
      parseTimestamp(game.createdAt) ??
      parseTimestamp(moves[0]?.createdAt) ??
      Date.now();

    const snapshots: [number | null, number | null][] = [];

    for (const move of moves) {
      const moveTs = parseTimestamp(move.createdAt) ?? previousTs;
      const elapsed = Math.max(0, moveTs - previousTs);
      if (move.moveNumber % 2 === 1) {
        whiteTime = Math.max(0, whiteTime - elapsed);
      } else {
        blackTime = Math.max(0, blackTime - elapsed);
      }
      snapshots.push([whiteTime, blackTime]);
      previousTs = moveTs;
    }

    if (
      snapshots.length > 0 &&
      typeof game.whiteTimeLeft === "number" &&
      typeof game.blackTimeLeft === "number"
    ) {
      snapshots[snapshots.length - 1] = [
        game.whiteTimeLeft,
        game.blackTimeLeft,
      ];
    }

    return { initial, snapshots };
  }, [
    baseClock,
    game.createdAt,
    game.whiteTimeLeft,
    game.blackTimeLeft,
    moves,
  ]);

  const movesUpToCurrent = useMemo(
    () => (currentMoveIndex === -1 ? [] : moves.slice(0, currentMoveIndex + 1)),
    [currentMoveIndex, moves],
  );

  // Pre-compute check/checkmate suffix for each move.
  const moveSuffixes = useMemo(() => {
    const boardVariant = game.variant as GameVariant;
    return moves.map((move) => {
      try {
        const opponent: Side = move.moveNumber % 2 === 1 ? "blk" : "wht";
        const status = getBoardStatus(
          boardVariant,
          moves.slice(0, move.moveNumber),
          opponent,
        );
        return status === "checkmate" ? "++" : status === "check" ? "+" : "";
      } catch {
        return "";
      }
    });
  }, [moves, game.variant]);

  const moveMetadata = useMemo(() => {
    const boardState = getState(game.variant as GameVariant, []);
    return moves.map((move) => {
      const piece = boardState.board.get(move.fromSquare)?.type ?? "pawn";
      const isCapture =
        boardState.board.has(move.toSquare) ||
        (boardState.enPassantTarget?.[0] === move.toSquare && piece === "pawn");
      try {
        updateStateWithMove(
          boardState,
          move.fromSquare,
          move.toSquare,
          (move.promotion as PieceType) ?? undefined,
        );
      } catch {
        // Ignore errors from invalid move sequences.
      }
      return { piece: piece as PieceType, isCapture };
    });
  }, [moves, game.variant]);

  const handleCapturedPiecesChange = useCallback((next: CapturedPiece[]) => {
    setCapturedPieces((prev) => {
      if (
        prev.length === next.length &&
        prev.every((piece, index) => {
          const other = next[index];
          return piece.type === other?.type && piece.color === other?.color;
        })
      ) {
        return prev;
      }
      return next;
    });
  }, []);
  const replayTurn = movesUpToCurrent.length % 2 === 0 ? "wht" : "blk";

  const whiteCaptured = capturedPieces.filter((p) => p.color === "wht");
  const blackCaptured = capturedPieces.filter((p) => p.color === "blk");

  const [whiteClock, blackClock] =
    currentMoveIndex === -1
      ? replayClocks.initial
      : (replayClocks.snapshots[currentMoveIndex] ?? replayClocks.initial);

  const topLabel = blackUsername;
  const botLabel = whiteUsername;
  const topRole = "♚ Black";
  const botRole = "♔ White";
  const topCaptured = whiteCaptured;
  const botCaptured = blackCaptured;
  const topTimer = blackClock;
  const botTimer = whiteClock;

  const progressPercent =
    moves.length === 0
      ? 0
      : Math.round(((currentMoveIndex + 1) / moves.length) * 100);

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

  const getMoveActor = () => {
    if (currentMoveIndex === -1) return "No move yet";
    const moveNum = moves[currentMoveIndex].moveNumber;
    return moveNum % 2 === 1 ? "White moved" : "Black moved";
  };

  const renderControls = () => (
    <Card className="bg-white border-4 border-black">
      <CardHeader className="border-b-4 border-black p-4 sm:p-6">
        <CardTitle className="text-xl sm:text-2xl font-bold uppercase">
          Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 space-y-5">
        <div className="space-y-2">
          <div className="flex justify-between text-xs sm:text-sm font-bold">
            <span>
              MOVE {Math.max(0, currentMoveIndex + 1)} / {moves.length}
            </span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full h-3 sm:h-4 bg-gray-200 border-4 border-black">
            <div
              className="h-full bg-black transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs sm:text-sm font-bold uppercase">
            Playback Speed
          </label>
          <div className="grid grid-cols-2 sm:flex gap-2">
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

        <div className="flex items-center justify-center gap-2 sm:gap-3">
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
            className="bg-black text-white hover:bg-gray-800 border-4 border-black px-4 sm:px-8 font-bold"
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

        {currentMoveIndex >= 0 && (
          <div className="p-3 sm:p-4 bg-gray-50 border-4 border-black">
            <div className="text-xs sm:text-sm font-bold text-gray-600 mb-1 uppercase">
              Current Move:
            </div>
            <div className="text-lg sm:text-2xl font-bold break-words">
              {moves[currentMoveIndex].moveNumber}.{" "}
              {moves[currentMoveIndex].fromSquare} →{" "}
              {moves[currentMoveIndex].toSquare}
              {moves[currentMoveIndex].promotion &&
                ` =${moves[currentMoveIndex].promotion}`}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 mt-2">
              {getMoveActor()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderMoveList = () => (
    <Card className="bg-white border-4 border-black">
      <CardHeader className="border-b-4 border-black p-4 sm:p-6">
        <CardTitle className="text-lg sm:text-xl font-bold uppercase">
          Move History
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[24rem] sm:max-h-[30rem] overflow-y-auto">
          <div className="p-2 space-y-1">
            <button
              onClick={() => handleJumpToMove(-1)}
              className={`w-full text-left p-2.5 sm:p-3 border-2 font-bold transition-colors ${
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
                className={`w-full text-left p-2.5 sm:p-3 border-2 transition-colors ${
                  currentMoveIndex === index
                    ? "bg-black text-white border-black"
                    : "bg-white border-gray-300 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-sm sm:text-base">
                  <span className="font-bold shrink-0">{move.moveNumber}.</span>
                  <span className="flex-1 min-w-0 truncate">
                    {`${pieceLabel(moveMetadata[index].piece)} `}
                    {toNotation(
                      move.fromSquare,
                      game.variant.startsWith("archimedean")
                        ? "archimedean"
                        : "concentric",
                    )}
                    {moveMetadata[index].isCapture ? "x" : "-"}
                    {toNotation(
                      move.toSquare,
                      game.variant.startsWith("archimedean")
                        ? "archimedean"
                        : "concentric",
                    )}
                    {move.promotion && ` =${move.promotion}`}
                    {moveSuffixes[index]}
                  </span>
                  <span className="text-xs sm:text-sm opacity-70 shrink-0">
                    {move.moveNumber % 2 === 1 ? "White" : "Black"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 px-3 py-4 sm:px-4 sm:py-5">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-4 sm:mb-6">
          <Link
            href="/history"
            className="inline-flex items-center gap-2 text-sm font-medium hover:underline mb-3"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to History
          </Link>

          <div className="bg-white border-4 border-black p-4 sm:p-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-black mb-2">
              GAME REPLAY
            </h1>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-base sm:text-lg">
                <span className="font-bold">{whiteUsername}</span>
                <span className="mx-2">vs</span>
                <span className="font-bold">{blackUsername}</span>
              </div>
              <div className="text-xs sm:text-sm font-medium px-3 py-1.5 bg-black text-white border-2 border-black uppercase w-fit">
                {game.status}
              </div>
            </div>
          </div>
        </div>

        <div className="hidden lg:grid lg:grid-cols-[minmax(0,1fr)_360px] gap-5 xl:gap-6 items-start">
          <div className="min-w-0">
            <div className="border-4 border-black bg-white max-w-[940px] mx-auto">
              <ReplayPlayerBar
                isWhiteSide={false}
                label={topLabel}
                role={topRole}
                timeLeft={topTimer}
                captured={topCaptured}
              />
              <div className="relative w-full aspect-square border-t-4 border-b-4 border-black overflow-hidden">
                <Board
                  moves={movesUpToCurrent}
                  onMove={() => {}}
                  onCapturedPiecesChange={handleCapturedPiecesChange}
                  viewerSide={undefined}
                  currentTurn={replayTurn}
                  isSpectator
                  canControlBoth={false}
                  gameOngoing={false}
                  isReplayMode
                  variant={game.variant as GameVariant}
                />
              </div>
              <ReplayPlayerBar
                isWhiteSide
                label={botLabel}
                role={botRole}
                timeLeft={botTimer}
                captured={botCaptured}
              />
            </div>

            <div className="mt-3 text-center">
              <p className="text-sm text-gray-600">
                {currentMoveIndex === -1
                  ? "Starting Position"
                  : `After move ${currentMoveIndex + 1} of ${moves.length}`}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {renderControls()}
            {renderMoveList()}
          </div>
        </div>

        <div className="lg:hidden space-y-4">
          <div className="border-4 border-black bg-white">
            <ReplayPlayerBar
              isWhiteSide={false}
              label={topLabel}
              role={topRole}
              timeLeft={topTimer}
              captured={topCaptured}
            />
            <div className="relative w-full aspect-square border-t-4 border-b-4 border-black overflow-hidden">
              <Board
                moves={movesUpToCurrent}
                onMove={() => {}}
                onCapturedPiecesChange={handleCapturedPiecesChange}
                viewerSide={undefined}
                currentTurn={replayTurn}
                isSpectator
                canControlBoth={false}
                gameOngoing={false}
                isReplayMode
                variant={game.variant as GameVariant}
              />
            </div>
            <ReplayPlayerBar
              isWhiteSide
              label={botLabel}
              role={botRole}
              timeLeft={botTimer}
              captured={botCaptured}
            />
          </div>

          <div className="text-center text-sm text-gray-600">
            {currentMoveIndex === -1
              ? "Starting Position"
              : `After move ${currentMoveIndex + 1} of ${moves.length}`}
          </div>

          {renderControls()}
          {renderMoveList()}
        </div>
      </div>
    </div>
  );
}

function TimerDisplay({ timeLeft }: { timeLeft: number | null }) {
  if (timeLeft === null) return <span>∞</span>;
  const s = Math.floor(timeLeft / 1000);
  return (
    <span>
      {Math.floor(s / 60)}:{String(s % 60).padStart(2, "0")}
    </span>
  );
}

function ReplayPlayerBar({
  isWhiteSide,
  label,
  role,
  timeLeft,
  captured,
}: {
  isWhiteSide: boolean;
  label: string;
  role: string;
  timeLeft: number | null;
  captured: CapturedPiece[];
}) {
  return (
    <div
      className={`flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-2 ${
        isWhiteSide ? "bg-white text-black" : "bg-black text-white"
      }`}
    >
      <div className="shrink-0 min-w-[78px] sm:min-w-[90px]">
        <div className="font-black uppercase text-xs sm:text-sm leading-none truncate">
          {label}
        </div>
        <div className="text-[10px] uppercase tracking-wider font-bold leading-none mt-0.5 text-gray-400">
          {role}
        </div>
      </div>

      <div className="flex flex-wrap gap-0.5 flex-1 min-w-0">
        {captured.map((p, i) => (
          <Image
            key={`${p.type}-${p.color}-${i}`}
            src={`/pieces/${p.type}-${p.color}.png`}
            alt=""
            width={24}
            height={24}
            className="w-5 h-5 sm:w-6 sm:h-6"
          />
        ))}
      </div>

      <span
        className={`shrink-0 flex items-center justify-center text-center font-mono font-black tabular-nums text-base sm:text-xl border-2 px-2 py-0.5 ${
          isWhiteSide ? "border-black text-black" : "border-white text-white"
        }`}
      >
        <TimerDisplay timeLeft={timeLeft} />
      </span>
    </div>
  );
}
