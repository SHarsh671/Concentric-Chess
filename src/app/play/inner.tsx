"use client";

import { play, type PlayState } from "@/actions/play";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircleIcon, Globe, Monitor } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { GAME_VARIANTS } from "shared";

const COLOR_PREFERENCES = [
  { id: "white", label: "White", piece: "♙" },
  { id: "black", label: "Black", piece: "♟" },
  { id: "random", label: "Random", piece: "?" },
] as const;

const GAME_TYPES = [
  {
    id: "concentric",
    label: "Concentric",
    description: "Rings of expanding squares",
    piece: "♜",
  },
  {
    id: "archimedean",
    label: "Archimedean",
    description: "Spiral board geometry",
    piece: "♞",
  },
] as const;

const TIME_CONTROLS = [
  { id: "rapid", label: "Rapid", time: "10:00", sublabel: "10 min per side" },
  { id: "blitz", label: "Blitz", time: "3:00", sublabel: "3 min per side" },
  { id: "bullet", label: "Bullet", time: "1:00", sublabel: "1 min per side" },
  { id: "unlimited", label: "Unlimited", time: "∞", sublabel: "No time limit" },
] as const;

export default function PlayInner({
  isAuthenticated,
}: {
  isAuthenticated: boolean;
}) {
  const [state, formAction, pending] = useActionState(play, null);
  const [mode, setMode] = useState<"online" | "local">(state?.mode ?? "online");
  const [colorPreference, setColorPreference] = useState<
    "white" | "black" | "random"
  >((state as PlayState)?.colorPreference ?? "random");

  const defaultVariant = state?.variant ?? GAME_VARIANTS[0].variant;
  const [gameType, setGameType] = useState<"concentric" | "archimedean">(
    defaultVariant.startsWith("archimedean") ? "archimedean" : "concentric",
  );
  const [timeControl, setTimeControl] = useState(
    defaultVariant.split("-")[1] as "rapid" | "blitz" | "bullet" | "unlimited",
  );
  const variant = `${gameType}-${timeControl}`;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-lg mx-auto px-6 py-16">
        <div className="mb-12 text-center">
          <div className="text-7xl mb-3 select-none leading-none">♟</div>
          <h1 className="text-4xl font-black uppercase tracking-tight">
            New Game
          </h1>
          <p className="text-gray-400 mt-1 text-sm uppercase tracking-widest">
            Concentric Chess
          </p>
        </div>

        {!isAuthenticated && (
          <div className="mb-8 border-4 border-black bg-black text-white p-4">
            <div className="flex items-start gap-3">
              <AlertCircleIcon className="size-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-black uppercase tracking-widest text-xs">
                  Login Required
                </p>
                <p className="font-bold text-sm mt-1">
                  You must be logged in to start a game.
                </p>
                <Link
                  href="/login"
                  className="inline-block mt-3 border-2 border-white px-3 py-1 text-xs font-black uppercase tracking-widest hover:bg-white hover:text-black transition-colors"
                >
                  Go to Login
                </Link>
              </div>
            </div>
          </div>
        )}

        {state?.error && (
          <div className="mb-8 border-4 border-black bg-white p-4 flex items-center gap-3">
            <AlertCircleIcon className="size-5 shrink-0" />
            <span className="font-bold text-sm">{state.error}</span>
          </div>
        )}

        <form action={formAction} className="flex flex-col gap-10">
          <input type="hidden" name="variant" value={variant} />
          <input type="hidden" name="mode" value={mode} />
          {mode === "online" && (
            <input
              type="hidden"
              name="colorPreference"
              value={colorPreference}
            />
          )}

          <section>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
              Game Type
            </p>
            <div className="grid grid-cols-2 gap-3">
              {GAME_TYPES.map((gt) => {
                const selected = gameType === gt.id;
                return (
                  <button
                    type="button"
                    key={gt.id}
                    onClick={() => setGameType(gt.id)}
                    className={`border-4 p-5 text-left transition-all cursor-pointer focus:outline-none ${
                      selected
                        ? "border-black bg-black text-white"
                        : "border-gray-200 bg-white hover:border-gray-400"
                    }`}
                  >
                    <div
                      className={`text-3xl mb-2 leading-none select-none ${selected ? "opacity-80" : "opacity-30"}`}
                    >
                      {gt.piece}
                    </div>
                    <div className="font-bold uppercase tracking-wide text-sm leading-none">
                      {gt.label}
                    </div>
                    <div
                      className={`text-xs mt-1 ${selected ? "text-gray-400" : "text-gray-400"}`}
                    >
                      {gt.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
              Time Control
            </p>
            <div className="grid grid-cols-2 gap-3">
              {TIME_CONTROLS.map((tc) => {
                const selected = timeControl === tc.id;
                return (
                  <button
                    type="button"
                    key={tc.id}
                    onClick={() => setTimeControl(tc.id)}
                    className={`border-4 p-5 text-left transition-all cursor-pointer focus:outline-none ${
                      selected
                        ? "border-black bg-black text-white"
                        : "border-gray-200 bg-white hover:border-gray-400"
                    }`}
                  >
                    <div className="font-black text-3xl font-mono leading-none mb-2 tabular-nums">
                      {tc.time}
                    </div>
                    <div className="font-bold uppercase tracking-wide text-sm leading-none">
                      {tc.label}
                    </div>
                    <div
                      className={`text-xs mt-1 ${selected ? "text-gray-400" : "text-gray-400"}`}
                    >
                      {tc.sublabel}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
              Mode
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode("online")}
                className={`border-4 p-5 text-left transition-all cursor-pointer focus:outline-none ${
                  mode === "online"
                    ? "border-black bg-black text-white"
                    : "border-gray-200 bg-white hover:border-gray-400"
                }`}
              >
                <Globe
                  className={`size-5 mb-3 ${mode === "online" ? "text-gray-300" : "text-gray-400"}`}
                />
                <div className="font-bold uppercase tracking-wide text-sm leading-none">
                  Online
                </div>
                <div
                  className={`text-xs mt-1 ${mode === "online" ? "text-gray-400" : "text-gray-400"}`}
                >
                  Challenge players worldwide
                </div>
              </button>
              <button
                type="button"
                onClick={() => setMode("local")}
                className={`border-4 p-5 text-left transition-all cursor-pointer focus:outline-none ${
                  mode === "local"
                    ? "border-black bg-black text-white"
                    : "border-gray-200 bg-white hover:border-gray-400"
                }`}
              >
                <Monitor
                  className={`size-5 mb-3 ${mode === "local" ? "text-gray-300" : "text-gray-400"}`}
                />
                <div className="font-bold uppercase tracking-wide text-sm leading-none">
                  Local
                </div>
                <div
                  className={`text-xs mt-1 ${mode === "local" ? "text-gray-400" : "text-gray-400"}`}
                >
                  Two players, one screen
                </div>
              </button>
            </div>
          </section>

          {mode === "online" && (
            <section>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
                Color{" "}
                <span className="normal-case font-normal tracking-normal text-gray-300">
                  (invite only)
                </span>
              </p>
              <div className="grid grid-cols-3 gap-3">
                {COLOR_PREFERENCES.map((cp) => {
                  const selected = colorPreference === cp.id;
                  return (
                    <button
                      type="button"
                      key={cp.id}
                      onClick={() => setColorPreference(cp.id)}
                      className={`border-4 p-5 text-left transition-all cursor-pointer focus:outline-none ${
                        selected
                          ? "border-black bg-black text-white"
                          : "border-gray-200 bg-white hover:border-gray-400"
                      }`}
                    >
                      <div
                        className={`text-3xl mb-2 leading-none select-none ${selected ? "opacity-80" : "opacity-30"}`}
                      >
                        {cp.piece}
                      </div>
                      <div className="font-bold uppercase tracking-wide text-sm leading-none">
                        {cp.label}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {mode === "online" && (
            <section>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
                Opponent{" "}
                <span className="normal-case font-normal tracking-normal text-gray-300">
                  (leave blank to find a random match)
                </span>
              </p>
              <Input
                type="text"
                name="username"
                placeholder="Enter username or leave blank for random match"
                defaultValue={(state as PlayState)?.username ?? ""}
                className="h-14 border-4 border-black rounded-none font-bold text-base placeholder:text-gray-300 placeholder:font-normal focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-black px-4"
              />
            </section>
          )}

          <Button
            type="submit"
            disabled={pending || !isAuthenticated}
            className="h-16 bg-black text-white border-4 border-black rounded-none font-black uppercase tracking-widest text-sm shadow-[6px_6px_0px_0px_rgba(0,0,0,0.12)] hover:shadow-none hover:translate-x-[6px] hover:translate-y-[6px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="mr-2 text-base">♟</span>
            {isAuthenticated ? "Start Game" : "Login to Start"}
          </Button>
        </form>

        <div className="mt-16 text-center text-2xl tracking-widest opacity-8 select-none">
          ♜♞♝♛♚♝♞♜
        </div>
      </div>
    </div>
  );
}
