"use client";

import { Button } from "@/components/ui/button";
import { GameSocket } from "@/lib/ws";
import { useEffect, useMemo, useRef, useState } from "react";
import { Game, Move } from "shared";
import "client-only";
import Board, { CapturedPiece } from "@/components/piece/board";
import RulesDialog from "@/components/piece/rules-dialog";
import { HelpCircle, LoaderCircle } from "lucide-react";
import { pieceLabel, toNotation } from "@/lib/utils";
import SpiralRulesDialog from "@/components/piece/spiral-rules-dialog";
import { initialPieces, PieceType } from "shared/concentric-rules";
import Image from "next/image";

export default function GamePage({
  game: initialGame,
  moves: initialMoves,
  playerId,
}: {
  game: Game;
  moves: Move[];
  playerId: string | undefined;
}) {
  const [game, setGame] = useState(initialGame);
  const ws = useMemo(() => GameSocket.getInstance(initialGame.id), [initialGame.id]);
  const [moves, setMoves] = useState(initialMoves);
  const [showRules, setShowRules] = useState(false);
  // Flat array — filter by color where needed
  const [capturedPieces, setCapturedPieces] = useState<CapturedPiece[]>([]);

  const gameRef = useRef(game);

  const onMove = (from: string, to: string) => {
    ws.send({
      type: "move",
      data: {
        side: game.nextMove % 2 === 1 ? "white" : "black",
        from,
        to,
      },
    });
  };

  const groupedMoves = useMemo(() => {
    const out: Record<number, { w?: (typeof moves[0]) & { piece: PieceType }; b?: typeof moves[0] & { piece: PieceType } }> = {};
    const state = initialPieces.reduce((acc, piece) => {
      acc[piece.position] = piece;
      return acc;
    }, {} as Record<string, { type: PieceType; color: string }>);
    for (const move of moves) {
      const turn = Math.floor((move.moveNumber - 1) / 2) + 1;
      const side = move.moveNumber % 2 === 1 ? "w" : "b";

      if (!out[turn]) out[turn] = {};
      if (!state[move.fromSquare]) {
        console.error(`Invalid move from ${move.fromSquare} to ${move.toSquare}: no piece at fromSquare`, moves, state);
      }
      out[turn][side] = {
        piece: state[move.fromSquare].type,
        ...move,
      };
      state[move.toSquare] = state[move.fromSquare];
      delete state[move.fromSquare];
    }
    return Object.entries(out).sort((a, b) => parseInt(a[0]) - parseInt(b[0])).map((entry) => entry);
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
            console.error(`Received move ${move.moveNumber}, expected ${gameRef.current.nextMove}`);
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
          setGame((prev) => ({ ...prev, status: "aborted", deletedAt: new Date().toISOString() }));
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
      }
    });
    return () => {
      ws.setListener(null);
      ws.disconnect();
    };
  }, [game.id]);

  const timeSinceLastMove =
    Date.now() - new Date(game.lastMoveAt || game.createdAt!).getTime();
  const [timer, setTimer] = useState([
    game.nextMove % 2 === 1
      ? game.whiteTimeLeft !== null ? Math.max(0, game.whiteTimeLeft - timeSinceLastMove) : null
      : game.whiteTimeLeft,
    game.nextMove % 2 === 0
      ? game.blackTimeLeft !== null ? Math.max(0, game.blackTimeLeft - timeSinceLastMove) : null
      : game.blackTimeLeft,
  ]);

  useEffect(() => {
    if (game.status !== "ongoing") return;
    const interval = setInterval(() => {
      const elapsed = Date.now() - new Date(game.lastMoveAt || game.createdAt!).getTime();
      if (game.nextMove % 2 === 1) {
        setTimer([
          game.whiteTimeLeft !== null ? Math.max(0, game.whiteTimeLeft - elapsed) : null,
          game.blackTimeLeft,
        ]);
      } else {
        setTimer([
          game.whiteTimeLeft,
          game.blackTimeLeft !== null ? Math.max(0, game.blackTimeLeft - elapsed) : null,
        ]);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [game.status, game.nextMove, game.whiteTimeLeft, game.blackTimeLeft, game.lastMoveAt, game.createdAt]);

  if (!game) return (
    <div className="min-h-screen bg-white flex items-center justify-center w-full">
      <div className="border-4 border-black p-12 max-w-md w-full text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="text-7xl mb-6 select-none opacity-30">♙</div>
        <div className="inline-flex items-center gap-2 border-2 border-black px-4 py-1 mb-4 text-xs font-bold uppercase tracking-widest">
          404
        </div>
        <h1 className="text-3xl font-bold uppercase tracking-wide mb-3">Game Not Found</h1>
        <p className="text-gray-500">This game doesn&apos;t exist or has been removed.</p>
      </div>
    </div>
  );
  if (game.status === "aborted") return (
    <div className="min-h-screen bg-white flex items-center justify-center w-full">
      <div className="border-4 border-black p-12 max-w-md w-full text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="text-7xl mb-6 select-none opacity-30">✕</div>
        <div className="inline-flex items-center gap-2 border-2 border-black px-4 py-1 mb-4 text-xs font-bold uppercase tracking-widest">
          Aborted
        </div>
        <h1 className="text-3xl font-bold uppercase tracking-wide mb-3">Game Aborted</h1>
        <p className="text-gray-500">This game was aborted before it could begin.</p>
      </div>
    </div>
  );
  if (game.deletedAt) return (
    <div className="min-h-screen bg-white flex items-center justify-center w-full">
      <div className="border-4 border-black p-12 max-w-md w-full text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="text-7xl mb-6 select-none opacity-30">♙</div>
        <div className="inline-flex items-center gap-2 border-2 border-black px-4 py-1 mb-4 text-xs font-bold uppercase tracking-widest">
          404
        </div>
        <h1 className="text-3xl font-bold uppercase tracking-wide mb-3">Game Not Found</h1>
        <p className="text-gray-500">This game doesn&apos;t exist or has been removed.</p>
      </div>
    </div>
  );
  if ((game.blackPlayerId === playerId && game.blackAccepted === 0) ||
    (game.whitePlayerId === playerId && game.whiteAccepted === 0))
    return (
      <div className="min-h-screen bg-white flex items-center justify-center w-full">
        <div className="border-4 border-black p-12 max-w-md w-full text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="text-7xl mb-6 select-none">♟</div>
          <div className="inline-flex items-center gap-2 border-2 border-black px-4 py-1 mb-4 text-xs font-bold uppercase tracking-widest">
            <span>⚔</span> Challenge Received
          </div>
          <h1 className="text-3xl font-bold uppercase tracking-wide mb-3">Game Invite</h1>
          <p className="text-gray-500 mb-8">An opponent is ready to play. Accept to start the game.</p>
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
          <h1 className="text-3xl font-bold uppercase tracking-wide mb-3">Waiting for Opponent</h1>
          <p className="text-gray-500 mb-8">Your opponent hasn&apos;t accepted yet. Hang tight…</p>
          <div className="text-3xl opacity-10 select-none tracking-widest">♜♞♝♛♚♝♞♜</div>
        </div>
      </div>
    );

  const whiteCaptured = capturedPieces.filter((p) => p.color === "wht");
  const blackCaptured = capturedPieces.filter((p) => p.color === "blk");

  const isWhite = game.whitePlayerId === playerId;
  const isBlack = game.blackPlayerId === playerId;

  const isSpectator = !isWhite && !isBlack;
  const canControlBoth = isWhite && isBlack;

  // ONLY use viewerSide when exactly one side
  const viewerSide =
    isWhite && !isBlack
      ? "wht"
      : isBlack && !isWhite
        ? "blk"
        : undefined; // ← not null
  const currentTurn = game.nextMove % 2 === 1 ? "wht" : "blk";

  return (
    <div className="flex w-full gap-4">
      {/* Captured pieces sidebar */}
      <div className="w-[140px] border-4 border-black bg-white rounded-lg p-3 flex flex-col h-[900px] shrink-0">
        <div className="text-sm font-bold mb-3 uppercase text-center border-b-2 border-black pb-2">
          Captured<br />Pieces
        </div>
        <div className="flex-1 overflow-y-auto space-y-4">
          <div>
            <div className="text-xs font-bold text-gray-600 mb-1 text-center">White ♔</div>
            <div className="flex flex-col gap-1 items-center">
              {whiteCaptured.length === 0 ? (
                <span className="text-xs text-gray-400 italic">None</span>
              ) : (
                whiteCaptured.map((piece, idx) => (
                  <Image
                    key={`white-${piece.type}-${idx}`}
                    src={`/pieces/${piece.type}-${piece.color}.png`}
                    alt={`${piece.color} ${piece.type}`}
                    className="w-14 h-14 opacity-80"
                  />
                ))
              )}
            </div>
          </div>
          <div className="border-t-2 border-gray-300" />
          <div>
            <div className="text-xs font-bold text-gray-600 mb-1 text-center">Black ♚</div>
            <div className="flex flex-col gap-1 items-center">
              {blackCaptured.length === 0 ? (
                <span className="text-xs text-gray-400 italic">None</span>
              ) : (
                blackCaptured.map((piece, idx) => (
                  <Image
                    key={`black-${piece.type}-${idx}`}
                    src={`/pieces/${piece.type}-${piece.color}.png`}
                    alt={`${piece.color} ${piece.type}`}
                    className="w-14 h-14 opacity-80"
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main board */}
      <div className="flex flex-col items-center space-y-4">
        {game.status === "white_win" && <div>White wins!</div>}
        {game.status === "black_win" && <div>Black wins!</div>}
        {game.status === "draw" && <div>Draw!</div>}
        {game.status === "white_resign" && (
          <div>White resigns. Black wins!</div>
        )}
        {game.status === "black_resign" && (
          <div>Black resigns. White wins!</div>
        )}
        You are{" "}
        {game.whitePlayerId === playerId && game.blackPlayerId === playerId
          ? "both players"
          : game.whitePlayerId === playerId
            ? "White"
            : game.blackPlayerId === playerId
              ? "Black"
              : "a spectator"}
        . It is {game.nextMove % 2 === 1 ? "White's" : "Black's"} turn.
        <div className="relative w-[900px] h-[900px] border-2">
          {/* Overlay: SVG cells + pieces */}
          <div className="absolute top-0 left-0 w-full h-full">
            <Board
              moves={moves}
              onMove={onMove}
              onCapturedPiecesChange={(pieces) => {
                console.log("CAPTURED:", pieces);
                setCapturedPieces(pieces);
              }}
              viewerSide={viewerSide}
              currentTurn={currentTurn}
              isSpectator={isSpectator}
              canControlBoth={canControlBoth}
              variant={game.variant.split("-")[0] as "concentric" | "archimedean"}
            />
          </div>
        </div>
      </div>

      {/* Game sidebar */}
      <div className="relative w-[30%] h-[70%] border-2 mt-[24px]">
        <div className="flex w-full h-1/5">
          <div className="relative w-1/3 h-1/2 top-1/4 left-1/18 border-gray-400 border-2 rounded-2xl bg-gray-200 text-center text-[37px] text-black"><Timer timeLeft={timer[0]}></Timer></div>
          <div className="relative w-1/3 h-1/2 top-1/4 left-5/18 border-gray-800 border-2 rounded-2xl bg-gray-600 text-center text-[37px] text-white"><Timer timeLeft={timer[1]}></Timer></div>
        </div>
        <div className="relative flex w-18/20 mx-auto h-3/5 border-2 rounded-md overflow-y-auto flex-col-reverse">
          {groupedMoves.map(([turn, move]) => {
            return (
              <div
                key={turn}
                className="grid grid-cols-[40px_1fr_1fr] items-center px-2 py-1 hover:bg-muted/40"
              >
                <span className="font-semibold">{turn}.</span>

                <span>
                  {move.w && `${pieceLabel(move.w.piece)} ${toNotation(move.w.fromSquare)}-${toNotation(move.w.toSquare)}`}
                </span>

                <span>
                  {move.b && `${pieceLabel(move.b.piece)} ${toNotation(move.b.fromSquare)}-${toNotation(move.b.toSquare)}`}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex w-full h-1/5">
          <Button className="relative w-4/15 h-1/2 top-1/3 border-orange-400 border-2 rounded-2xl bg-orange-300 text-center text-xl text-orange-900" onClick={() => ws.send({ type: "undo" })}>Undo</Button>
          <Button className="relative w-2/5 h-1/2 top-1/3 left-1/15 border-orange-400 border-2 rounded-2xl bg-orange-300 text-center text-xl text-orange-900" onClick={() => ws.send({ type: "draw" })}>Draw</Button>
          <Button className="relative w-2/5 h-1/2 top-1/3 left-4/30 border-orange-400 border-2 rounded-2xl bg-orange-300 text-center text-xl text-orange-900" onClick={() => ws.send({ type: "resign" })}>Resign</Button>
        </div>
        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 max-w-[900px] text-sm text-blue-800 mt-[24px]">
          <p className="font-semibold mb-1">💡 How to move:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Click a piece to select it</li>
            <li>Click a legal destination cell to select a move</li>
            <li>Click the destination again to confirm the move</li>
          </ol>
        </div>
        <Button
          onClick={() => setShowRules(true)}
          variant="outline"
          className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 border-indigo-300 text-indigo-700 mt-4"
        >
          <HelpCircle size={20} />
          Rules
        </Button>
      </div>

      {game.variant.startsWith("concentric") ? (<RulesDialog isOpen={showRules} onClose={() => setShowRules(false)} />) : <SpiralRulesDialog isOpen={showRules} onClose={() => setShowRules(false)} />}
    </div>
  );
}

function Timer({ timeLeft }: { timeLeft: number | null }) {
  if (timeLeft === null) return <div className="inline-block text-center">∞</div>;
  const seconds = Math.floor(timeLeft / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return (
    <div className="inline-block text-center">
      {minutes}:{remainingSeconds.toString().padStart(2, "0")}
    </div>
  );
}
