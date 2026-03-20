"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GameSocket } from "@/lib/ws";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Game, Move } from "shared";
import "client-only";
import Board, { CapturedPiece } from "@/components/piece/board";
import RulesDialog from "@/components/piece/rules-dialog";
import { HelpCircle, LoaderCircle } from "lucide-react";
import { pieceLabel, toNotation } from "@/lib/utils";
import SpiralRulesDialog from "@/components/piece/spiral-rules-dialog";
import { initialPieces } from "shared/concentric-rules";
import { PieceType, Side } from "shared/graph";
import Image from "next/image";
import {
  computePieceStateConcentric,
  gameStatusConcentric,
} from "shared/concentric-rules";
import {
  computePieceStateArchimedean,
  gameStatusArchimedean,
} from "shared/archimedean-rules";

export default function GamePage({
  game: initialGame,
  moves: initialMoves,
  playerId,
  whiteUsername,
  blackUsername,
}: {
  game: Game;
  moves: Move[];
  playerId: string | undefined;
  whiteUsername: string | null;
  blackUsername: string | null;
}) {
  const [game, setGame] = useState(initialGame);
  const ws = useMemo(
    () => GameSocket.getInstance(initialGame.id),
    [initialGame.id],
  );
  const [moves, setMoves] = useState(initialMoves);
  const [showRules, setShowRules] = useState(false);
  // Flat array — filter by color where needed
  const [capturedPieces, setCapturedPieces] = useState<CapturedPiece[]>([]);

  const gameRef = useRef(game);

  // Dynamic board sizing using callback ref so the ResizeObserver attaches
  // even when the component first renders a non-board screen (e.g. "waiting for opponent").
  const [boardColEl, setBoardColEl] = useState<HTMLDivElement | null>(null);
  const topBarRef = useRef<HTMLDivElement>(null);
  const botBarRef = useRef<HTMLDivElement>(null);
  const [boardPx, setBoardPx] = useState(0);
  const computeBoardSize = useRef<() => void>(() => {});

  useLayoutEffect(() => {
    if (!boardColEl) return;
    const compute = () => {
      const { width, height } = boardColEl.getBoundingClientRect();
      const topH = topBarRef.current?.getBoundingClientRect().height ?? 68;
      const botH = botBarRef.current?.getBoundingClientRect().height ?? 68;
      // subtract bar heights and 8px for top/bottom borders of the whole block
      const size = Math.min(width - 8, height - topH - botH - 8);
      setBoardPx(Math.max(0, Math.floor(size)));
    };
    computeBoardSize.current = compute;
    const ro = new ResizeObserver(compute);
    ro.observe(boardColEl);
    compute(); // run immediately on mount
    return () => ro.disconnect();
  }, [boardColEl]);

  const onMove = (from: string, to: string, promotion?: PieceType | null) => {
    ws.send({
      type: "move",
      data: {
        side: game.nextMove % 2 === 1 ? "white" : "black",
        from,
        to,
        promotion: promotion ?? null,
      },
    });
  };

  const groupedMoves = useMemo(() => {
    const out: Record<
      number,
      {
        w?: (typeof moves)[0] & { piece: PieceType };
        b?: (typeof moves)[0] & { piece: PieceType };
      }
    > = {};
    const state = initialPieces.reduce(
      (acc, piece) => {
        acc[piece.position] = piece;
        return acc;
      },
      {} as Record<string, { type: PieceType; color: string }>,
    );
    for (const move of moves) {
      const turn = Math.floor((move.moveNumber - 1) / 2) + 1;
      const side = move.moveNumber % 2 === 1 ? "w" : "b";

      if (!out[turn]) out[turn] = {};
      if (!state[move.fromSquare]) {
        console.error(
          `Invalid move from ${move.fromSquare} to ${move.toSquare}: no piece at fromSquare`,
          moves,
          state,
        );
      }
      out[turn][side] = {
        piece: state[move.fromSquare].type,
        ...move,
      };
      state[move.toSquare] = state[move.fromSquare];
      delete state[move.fromSquare];
    }
    return Object.entries(out)
      .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
      .map((entry) => entry);
  }, [moves]);

  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  useEffect(() => {
    ws.setListener((message) => {
      switch (message.type) {
        case "move": {
          const move = message.data.move;
          if (move.moveNumber !== gameRef.current.nextMove) {
            console.error(
              `Received move ${move.moveNumber}, expected ${gameRef.current.nextMove}`,
            );
            ws.send({ type: "sync_request" });
          } else {
            setMoves((prev) => [...prev, move]);
            setGame((prev) => ({
              ...prev,
              nextMove: message.data.nextMove,
              lastMoveAt: message.data.lastMoveAt,
              whiteTimeLeft: message.data.whiteTimeLeft,
              blackTimeLeft: message.data.blackTimeLeft,
            }));
          }
          break;
        }
        case "aborted":
          setGame((prev) => ({
            ...prev,
            status: "aborted",
            deletedAt: new Date().toISOString(),
          }));
          break;
        case "accepted":
          setGame((prev) => ({
            ...prev,
            whitePlayerId: message.data.whitePlayerId,
            blackPlayerId: message.data.blackPlayerId,
            whiteAccepted: 1,
            blackAccepted: 1,
          }));
          break;
        case "game_over":
          setGame((prev) => ({ ...prev, status: message.data.result }));
          break;
        case "sync":
          setGame(message.data.game);
          setMoves(message.data.moves);
          break;
        case "draw_offer":
          setGame((prev) => ({ ...prev, ...message.data }));
          break;
        case "draw_reject":
          setGame((prev) => ({
            ...prev,
            whiteDrawOffer: 0,
            blackDrawOffer: 0,
          }));
          toast("Draw offer declined", {
            description: "Your opponent declined the draw.",
          });
          break;
      }
    });
    return () => {
      ws.setListener(null);
      ws.disconnect();
    };
  }, [game.id]);

  const timeSinceLastMove =
    game.status === "ongoing"
      ? Date.now() - new Date(game.lastMoveAt || game.createdAt!).getTime()
      : 0;
  const [timer, setTimer] = useState([
    game.nextMove % 2 === 1
      ? game.whiteTimeLeft !== null
        ? Math.max(0, game.whiteTimeLeft - timeSinceLastMove)
        : null
      : game.whiteTimeLeft,
    game.nextMove % 2 === 0
      ? game.blackTimeLeft !== null
        ? Math.max(0, game.blackTimeLeft - timeSinceLastMove)
        : null
      : game.blackTimeLeft,
  ]);

  useEffect(() => {
    if (game.status !== "ongoing") return;
    const interval = setInterval(() => {
      const elapsed =
        Date.now() - new Date(game.lastMoveAt || game.createdAt!).getTime();
      if (game.nextMove % 2 === 1) {
        setTimer([
          game.whiteTimeLeft !== null
            ? Math.max(0, game.whiteTimeLeft - elapsed)
            : null,
          game.blackTimeLeft,
        ]);
      } else {
        setTimer([
          game.whiteTimeLeft,
          game.blackTimeLeft !== null
            ? Math.max(0, game.blackTimeLeft - elapsed)
            : null,
        ]);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [
    game.status,
    game.nextMove,
    game.whiteTimeLeft,
    game.blackTimeLeft,
    game.lastMoveAt,
    game.createdAt,
  ]);

  // Freeze timer when game ends (snap to authoritative game-stored values)
  useEffect(() => {
    if (game.status !== "ongoing") {
      setTimer([game.whiteTimeLeft, game.blackTimeLeft]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.status]);

  // Recompute board size when top-banner conditions can change.
  // `game.status` covers terminal banners, while `nextMove`/`moves.length` cover
  // tactical banners like check that can appear/disappear during ongoing games.
  useEffect(() => {
    computeBoardSize.current();
  }, [game.status, game.nextMove, moves.length]);

  if (!game)
    return (
      <div className="min-h-screen bg-white flex items-center justify-center w-full">
        <div className="border-4 border-black p-12 max-w-md w-full text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="text-7xl mb-6 select-none opacity-30">♙</div>
          <div className="inline-flex items-center gap-2 border-2 border-black px-4 py-1 mb-4 text-xs font-bold uppercase tracking-widest">
            404
          </div>
          <h1 className="text-3xl font-bold uppercase tracking-wide mb-3">
            Game Not Found
          </h1>
          <p className="text-gray-500">
            This game doesn&apos;t exist or has been removed.
          </p>
        </div>
      </div>
    );
  if (game.status === "aborted")
    return (
      <div className="min-h-screen bg-white flex items-center justify-center w-full">
        <div className="border-4 border-black p-12 max-w-md w-full text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="text-7xl mb-6 select-none opacity-30">✕</div>
          <div className="inline-flex items-center gap-2 border-2 border-black px-4 py-1 mb-4 text-xs font-bold uppercase tracking-widest">
            Aborted
          </div>
          <h1 className="text-3xl font-bold uppercase tracking-wide mb-3">
            Game Aborted
          </h1>
          <p className="text-gray-500">
            This game was aborted before it could begin.
          </p>
        </div>
      </div>
    );
  if (game.deletedAt)
    return (
      <div className="min-h-screen bg-white flex items-center justify-center w-full">
        <div className="border-4 border-black p-12 max-w-md w-full text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="text-7xl mb-6 select-none opacity-30">♙</div>
          <div className="inline-flex items-center gap-2 border-2 border-black px-4 py-1 mb-4 text-xs font-bold uppercase tracking-widest">
            404
          </div>
          <h1 className="text-3xl font-bold uppercase tracking-wide mb-3">
            Game Not Found
          </h1>
          <p className="text-gray-500">
            This game doesn&apos;t exist or has been removed.
          </p>
        </div>
      </div>
    );
  if (
    (game.blackPlayerId === playerId && game.blackAccepted === 0) ||
    (game.whitePlayerId === playerId && game.whiteAccepted === 0)
  )
    return (
      <div className="min-h-screen bg-white flex items-center justify-center w-full">
        <div className="border-4 border-black p-12 max-w-md w-full text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="text-7xl mb-6 select-none">♟</div>
          <div className="inline-flex items-center gap-2 border-2 border-black px-4 py-1 mb-4 text-xs font-bold uppercase tracking-widest">
            <span>⚔</span> Challenge Received
          </div>
          <h1 className="text-3xl font-bold uppercase tracking-wide mb-3">
            Game Invite
          </h1>
          <p className="text-gray-500 mb-8">
            An opponent is ready to play. Accept to start the game.
          </p>
          <Button
            onClick={() => ws.send({ type: "accept" })}
            className="w-full h-14 bg-black text-white border-4 border-black rounded-none font-bold uppercase tracking-widest text-base shadow-[6px_6px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-none hover:translate-x-[6px] hover:translate-y-[6px] transition-all"
          >
            ♚ Accept Game
          </Button>
        </div>
      </div>
    );
  if (game.whiteAccepted === 0 || game.blackAccepted === 0)
    return (
      <div className="min-h-screen bg-white flex items-center justify-center w-full">
        <div className="border-4 border-black p-12 max-w-md w-full text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="text-7xl mb-6 select-none animate-pulse">♟</div>
          <div className="inline-flex items-center gap-3 border-2 border-black px-4 py-1 mb-4 text-xs font-bold uppercase tracking-widest">
            <LoaderCircle className="size-3 animate-spin" /> Matchmaking
          </div>
          <h1 className="text-3xl font-bold uppercase tracking-wide mb-3">
            Waiting for Opponent
          </h1>
          <p className="text-gray-500 mb-8">
            Your opponent hasn&apos;t accepted yet. Hang tight…
          </p>
          <div className="text-3xl opacity-10 select-none tracking-widest">
            ♜♞♝♛♚♝♞♜
          </div>
        </div>
      </div>
    );

  const whiteCaptured = capturedPieces.filter((p) => p.color === "wht");
  const blackCaptured = capturedPieces.filter((p) => p.color === "blk");

  const isWhite = game.whitePlayerId === playerId;
  const isBlack = game.blackPlayerId === playerId;
  const isSpectator = !isWhite && !isBlack;
  const canControlBoth = isWhite && isBlack;

  const viewerSide: Side | undefined =
    isWhite && !isBlack ? "wht" : isBlack && !isWhite ? "blk" : undefined;
  const currentTurn: Side = game.nextMove % 2 === 1 ? "wht" : "blk";

  // Board orientation: white on bottom unless you're playing black.
  // Local game (canControlBoth) → white bottom. Spectating → white bottom. Playing white → white bottom. Playing black → black bottom.
  const topIsWhite = viewerSide === "blk";
  const topTimer = topIsWhite ? timer[0] : timer[1];
  const botTimer = topIsWhite ? timer[1] : timer[0];
  const topActive = topIsWhite ? currentTurn === "wht" : currentTurn === "blk";
  const botActive = !topActive;
  // Show pieces each player CAPTURED: white captured black pieces, black captured white pieces.
  const topCaptured = topIsWhite ? blackCaptured : whiteCaptured;
  const botCaptured = topIsWhite ? whiteCaptured : blackCaptured;
  const topLabel = topIsWhite
    ? whiteUsername ?? "♔ White"
    : blackUsername ?? "♚ Black";
  const botLabel = topIsWhite
    ? blackUsername ?? "♚ Black"
    : whiteUsername ?? "♔ White";
  const topSideLabel = topIsWhite ? "♔ White" : "♚ Black";
  const botSideLabel = topIsWhite ? "♚ Black" : "♔ White";
  const topRole = isSpectator
    ? topSideLabel
    : viewerSide
    ? `Opponent · ${topSideLabel}`
    : topSideLabel;
  const botRole = isSpectator
    ? botSideLabel
    : viewerSide
    ? `You · ${botSideLabel}`
    : botSideLabel;

  // Draw offer state
  const myDrawOffer =
    viewerSide === "wht"
      ? game.whiteDrawOffer
      : viewerSide === "blk"
      ? game.blackDrawOffer
      : 0;
  const opponentDrawOffer =
    viewerSide === "wht"
      ? game.blackDrawOffer
      : viewerSide === "blk"
      ? game.whiteDrawOffer
      : 0;

  const boardVariant = game.variant.split("-")[0] as
    | "concentric"
    | "archimedean";
  const positionState = (() => {
    const pieces =
      boardVariant === "concentric"
        ? computePieceStateConcentric(moves)
        : computePieceStateArchimedean(moves);
    return boardVariant === "concentric"
      ? gameStatusConcentric(pieces, currentTurn, moves)
      : gameStatusArchimedean(pieces, currentTurn, moves);
  })();
  const statusMessage =
    game.status === "white_win"
      ? positionState === "checkmate"
        ? "♔ White Wins by Checkmate"
        : "♔ White Wins!"
      : game.status === "black_win"
      ? positionState === "checkmate"
        ? "♚ Black Wins by Checkmate"
        : "♚ Black Wins!"
      : game.status === "draw"
      ? positionState === "stalemate"
        ? "Draw by Stalemate"
        : "Game Drawn"
      : game.status === "white_resign"
      ? "White Resigned — Black Wins"
      : game.status === "black_resign"
      ? "Black Resigned — White Wins"
      : null;
  const tacticalStatusMessage =
    positionState === "check"
      ? `${currentTurn === "wht" ? "♔ White" : "♚ Black"} in Check`
      : positionState === "checkmate"
      ? "Checkmate"
      : positionState === "stalemate"
      ? "Stalemate"
      : positionState === "draw"
      ? "Draw"
      : null;
  const topBannerMessage = statusMessage ?? tacticalStatusMessage;
  const desktopBoardReady = boardPx > 0;

  const sharedBoardProps = {
    moves,
    onMove,
    onCapturedPiecesChange: setCapturedPieces,
    viewerSide,
    currentTurn,
    isSpectator,
    canControlBoth,
    variant: boardVariant,
  };

  // Player info bar used above and below the board
  // (defined at module level to prevent remount on every render)

  return (
    <div className="bg-white flex-1 flex flex-col overflow-hidden min-h-0">
      {/* Game over banner */}
      {topBannerMessage && (
        <div className="shrink-0 bg-black text-white text-center py-2.5 font-black uppercase tracking-widest text-sm">
          {topBannerMessage}
        </div>
      )}

      {/* ── DESKTOP (≥1024px): board + sidebar, full height ── */}
      <div className="hidden lg:flex flex-1 min-h-0 overflow-hidden">
        {/* Board column — ResizeObserver measures this to compute board size */}
        <div
          ref={setBoardColEl}
          className="flex-1 min-w-0 min-h-0 flex flex-col items-center justify-center overflow-hidden"
        >
          {desktopBoardReady ? (
            // Outer border wraps bars + board; inner horizontal dividers separate them
            <div
              className="border-4 border-black flex flex-col"
              style={{ width: boardPx + 8 }}
            >
              <div ref={topBarRef}>
                <PlayerBar
                  isWhiteSide={topIsWhite}
                  timeLeft={topTimer}
                  isActive={topActive}
                  captured={topCaptured}
                  label={topLabel}
                  role={topRole}
                  gameOngoing={game.status === "ongoing"}
                />
              </div>
              <div
                className="relative border-t-4 border-b-4 border-black overflow-hidden shrink-0"
                style={{ width: boardPx, height: boardPx }}
              >
                <Board {...sharedBoardProps} />
              </div>
              <div ref={botBarRef}>
                <PlayerBar
                  isWhiteSide={!topIsWhite}
                  timeLeft={botTimer}
                  isActive={botActive}
                  captured={botCaptured}
                  label={botLabel}
                  role={botRole}
                  gameOngoing={game.status === "ongoing"}
                />
              </div>
            </div>
          ) : (
            <div className="w-full max-w-4xl border-4 border-black bg-white/60 px-4 py-10 text-center text-xs font-bold uppercase tracking-widest text-gray-500">
              Loading board…
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-72 shrink-0 border-l-4 border-black flex flex-col bg-white min-h-0">
          {/* Turn indicator */}
          <div className="shrink-0 flex items-center justify-between px-4 py-2.5 border-b-2 border-black">
            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
              {isSpectator
                ? "Spectating"
                : canControlBoth
                ? "Both Sides"
                : viewerSide === "wht"
                ? "Playing White"
                : "Playing Black"}
            </span>
            <span className="text-[11px] font-black uppercase border-2 border-black px-2 py-0.5 bg-black text-white">
              {currentTurn === "wht" ? "♔ White" : "♚ Black"}
            </span>
          </div>

          {/* Move history — scrollable, fills remaining space */}
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            <div className="shrink-0 bg-black text-white text-[10px] font-bold uppercase tracking-widest py-2 px-4">
              Move History
            </div>
            <div className="flex-1 overflow-y-auto flex flex-col-reverse">
              <MoveList groupedMoves={groupedMoves} variant={boardVariant} />
            </div>
          </div>

          {/* Actions */}
          {!isSpectator && game.status === "ongoing" && (
            <div className="shrink-0 border-t-2 border-black p-3">
              {opponentDrawOffer === 1 ? (
                <DrawOfferPrompt onSend={(type) => ws.send({ type })} />
              ) : (
                <ActionButtons
                  onSend={(type) => ws.send({ type })}
                  drawOffered={myDrawOffer === 1}
                />
              )}
            </div>
          )}

          {/* Rules */}
          <div className="shrink-0 border-t-2 border-black p-3">
            <button
              onClick={() => setShowRules(true)}
              className="w-full py-2 font-bold uppercase text-xs border-4 border-black hover:bg-black hover:text-white transition-all flex items-center justify-center gap-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px]"
            >
              <HelpCircle size={14} /> Game Rules
            </button>
          </div>
        </div>
      </div>

      {/* ── MOBILE (<1024px): stacked, scrollable ── */}
      <div className="lg:hidden flex flex-col">
        <div className="border-4 border-black">
          <div>
            <PlayerBar
              isWhiteSide={topIsWhite}
              timeLeft={topTimer}
              isActive={topActive}
              captured={topCaptured}
              label={topLabel}
              role={topRole}
              gameOngoing={game.status === "ongoing"}
            />
          </div>
          {/* Board: full width, square via aspect-ratio */}
          <div
            className="relative w-full border-t-4 border-b-4 border-black overflow-hidden"
            style={{ aspectRatio: "1 / 1" }}
          >
            <Board {...sharedBoardProps} />
          </div>
          <div>
            <PlayerBar
              isWhiteSide={!topIsWhite}
              timeLeft={botTimer}
              isActive={botActive}
              captured={botCaptured}
              label={botLabel}
              role={botRole}
              gameOngoing={game.status === "ongoing"}
            />
          </div>
        </div>
        {!isSpectator && game.status === "ongoing" && (
          <div className="p-3 border-b-4 border-black">
            {opponentDrawOffer === 1 ? (
              <DrawOfferPrompt onSend={(type) => ws.send({ type })} />
            ) : (
              <ActionButtons
                onSend={(type) => ws.send({ type })}
                drawOffered={myDrawOffer === 1}
              />
            )}
          </div>
        )}
        <div className="border-b-4 border-black">
          <div className="bg-black text-white text-[10px] font-bold uppercase tracking-widest py-2 px-4">
            Move History
          </div>
          <div className="max-h-64 overflow-y-auto flex flex-col-reverse">
            <MoveList groupedMoves={groupedMoves} />
          </div>
        </div>
        <button
          onClick={() => setShowRules(true)}
          className="w-full py-3 font-bold uppercase text-sm flex items-center justify-center gap-2 border-b-4 border-black hover:bg-black hover:text-white transition-colors"
        >
          <HelpCircle size={16} /> Game Rules
        </button>
      </div>

      {game.variant.startsWith("concentric") ? (
        <RulesDialog isOpen={showRules} onClose={() => setShowRules(false)} />
      ) : (
        <SpiralRulesDialog
          isOpen={showRules}
          onClose={() => setShowRules(false)}
        />
      )}
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

function PlayerBar({
  isWhiteSide,
  timeLeft,
  isActive,
  captured,
  label,
  role,
  gameOngoing,
}: {
  isWhiteSide: boolean;
  timeLeft: number | null;
  isActive: boolean;
  captured: CapturedPiece[];
  label: string;
  role: string;
  gameOngoing: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 px-3 py-2 ${
        isWhiteSide ? "bg-white text-black" : "bg-black text-white"
      }`}
    >
      <div className="shrink-0 min-w-[90px]">
        <div className="font-black uppercase text-sm leading-none">{label}</div>
        {role && (
          <div
            className={`text-[10px] uppercase tracking-wider font-bold leading-none mt-0.5 ${
              isWhiteSide ? "text-gray-400" : "text-gray-400"
            }`}
          >
            {role}
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-0.5 flex-1 min-w-0">
        {captured.map((p, i) => (
          <Image
            key={i}
            src={`/pieces/${p.type}-${p.color}.png`}
            alt=""
            width={24}
            height={24}
            className="w-6 h-6"
          />
        ))}
      </div>
      <div className="shrink-0 flex items-center gap-1.5">
        {isActive && gameOngoing && (
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
        )}
        <span
          className={`font-mono font-black tabular-nums text-xl border-2 px-2 py-0.5 ${
            isWhiteSide ? "border-black text-black" : "border-white text-white"
          }`}
        >
          <TimerDisplay timeLeft={timeLeft} />
        </span>
      </div>
    </div>
  );
}

function MoveList({
  groupedMoves,
  variant,
}: {
  groupedMoves: [
    string,
    {
      w?: { piece: PieceType; fromSquare: string; toSquare: string };
      b?: { piece: PieceType; fromSquare: string; toSquare: string };
    },
  ][];
  variant: "concentric" | "archimedean";
}) {
  return (
    <>
      {groupedMoves.map(([turn, move]) => (
        <div
          key={turn}
          className="grid grid-cols-[28px_1fr_1fr] items-center px-3 py-1 border-b border-gray-100 last:border-0 hover:bg-gray-50"
        >
          <span className="font-bold text-gray-400">{turn}.</span>
          <span className="truncate">
            {move.w &&
              `${pieceLabel(move.w.piece)} ${toNotation(
                move.w.fromSquare,
                variant,
              )}-${toNotation(move.w.toSquare, variant)}`}
          </span>
          <span className="truncate">
            {move.b &&
              `${pieceLabel(move.b.piece)} ${toNotation(
                move.b.fromSquare,
                variant,
              )}-${toNotation(move.b.toSquare, variant)}`}
          </span>
        </div>
      ))}
    </>
  );
}

function ActionButtons({
  onSend,
  drawOffered,
}: {
  onSend: (type: "undo" | "draw" | "resign") => void;
  drawOffered: boolean;
}) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => onSend("undo")}
        className="flex-1 py-2 font-bold uppercase text-xs bg-white border-4 border-black hover:bg-black hover:text-white transition-colors shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none"
      >
        Undo
      </button>
      {drawOffered ? (
        <div className="flex-1 py-2 font-bold uppercase text-xs text-center border-4 border-black bg-gray-100 text-gray-500">
          Draw Offered
        </div>
      ) : (
        <button
          onClick={() => onSend("draw")}
          className="flex-1 py-2 font-bold uppercase text-xs bg-white border-4 border-black hover:bg-black hover:text-white transition-colors shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none"
        >
          Draw
        </button>
      )}
      <button
        onClick={() => onSend("resign")}
        className="flex-1 py-2 font-bold uppercase text-xs bg-white border-4 border-black hover:bg-black hover:text-white transition-colors shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none"
      >
        Resign
      </button>
    </div>
  );
}

function DrawOfferPrompt({
  onSend,
}: {
  onSend: (type: "draw" | "draw_reject") => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs font-bold uppercase tracking-wide text-center">
        Opponent offers a draw
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onSend("draw")}
          className="flex-1 py-2 font-bold uppercase text-xs bg-black text-white border-4 border-black hover:bg-white hover:text-black transition-colors shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none"
        >
          Accept
        </button>
        <button
          onClick={() => onSend("draw_reject")}
          className="flex-1 py-2 font-bold uppercase text-xs bg-white border-4 border-black hover:bg-black hover:text-white transition-colors shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none"
        >
          Decline
        </button>
      </div>
    </div>
  );
}
