"use client";

import { play } from "@/actions/play";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircleIcon, LoaderCircle } from "lucide-react";
import { useActionState, useState } from "react";
import { GAME_VARIANTS } from "shared";

export default function PlayPage() {
  const [state, formAction, pending] = useActionState(play, null);
  const [mode, setMode] = useState<"online" | "local">(state?.mode || "online");

  return (
    <div className="min-h-screen bg-white">
      {/* Decorative header */}
      <div className="border-b-8 border-black bg-black text-white px-8 py-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 text-9xl opacity-5 select-none font-bold leading-none">
          ♟
        </div>
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 border-2 border-white px-4 py-1 mb-4 text-xs font-bold uppercase tracking-widest">
            <span>♔</span> New Game
          </div>
          <h1 className="text-5xl font-bold uppercase tracking-wide leading-tight">
            Start Playing
          </h1>
          <p className="mt-2 text-gray-400 text-lg">
            Choose your variant and challenge players worldwide.
          </p>
        </div>
      </div>

      <div className="px-8 py-10 max-w-3xl">
        {state?.error && (
          <div className="mb-6 border-4 border-black bg-white p-4 flex items-center gap-3">
            <AlertCircleIcon className="shrink-0" />
            <span className="font-bold">{state.error}</span>
          </div>
        )}

        <form action={formAction} className="flex flex-col gap-8">
          {/* Three columns */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Variant */}
            <div className="flex flex-col gap-2">
              <Label className="font-bold uppercase tracking-widest text-xs">
                ♜ Variant
              </Label>
              <Select
                name="variant"
                defaultValue={state?.variant || GAME_VARIANTS[0].variant}
              >
                <SelectTrigger className="h-12 border-4 border-black rounded-none font-bold focus:ring-0 focus:ring-offset-0">
                  <SelectValue placeholder="Select a variant" />
                </SelectTrigger>
                <SelectContent className="border-4 border-black rounded-none">
                  {GAME_VARIANTS.map((variant) => (
                    <SelectItem
                      key={variant.variant}
                      value={variant.variant}
                      className="font-bold rounded-none focus:bg-black focus:text-white"
                    >
                      {variant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Mode */}
            <div className="flex flex-col gap-2">
              <Label className="font-bold uppercase tracking-widest text-xs">
                ♞ Mode
              </Label>
              <Select
                name="mode"
                defaultValue={mode}
                onValueChange={(value) => setMode(value as "online" | "local")}
                value={mode}
              >
                <SelectTrigger className="h-12 border-4 border-black rounded-none font-bold focus:ring-0 focus:ring-offset-0">
                  <SelectValue placeholder="Select a mode" />
                </SelectTrigger>
                <SelectContent className="border-4 border-black rounded-none">
                  <SelectItem value="online" className="font-bold rounded-none focus:bg-black focus:text-white">
                    Online Multiplayer
                  </SelectItem>
                  <SelectItem value="local" className="font-bold rounded-none focus:bg-black focus:text-white">
                    Local Multiplayer
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Opponent */}
            <div className="flex flex-col gap-2">
              <Label className="font-bold uppercase tracking-widest text-xs">
                ♝ Opponent
              </Label>
              {mode === "online" ? (
                <Input
                  type="text"
                  name="username"
                  placeholder="Username"
                  defaultValue={state?.mode === "online" ? state?.username : ""}
                  className="h-12 border-4 border-black rounded-none font-bold placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-black"
                />
              ) : (
                <div className="h-12 border-4 border-gray-200 flex items-center px-3 text-gray-400 font-bold text-sm">
                  Same device
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={pending}
            className="h-14 bg-black text-white border-4 border-black rounded-none font-bold uppercase tracking-widest text-base shadow-[6px_6px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-none hover:translate-x-[6px] hover:translate-y-[6px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending ? (
              <LoaderCircle className="size-5 animate-spin mr-2" />
            ) : (
              <span className="mr-2">♟</span>
            )}
            {pending ? "Starting..." : "Start Game"}
          </Button>
        </form>

        {/* Decorative piece row */}
        <div className="mt-12 border-t-4 border-black pt-6 text-center text-3xl tracking-widest opacity-10 select-none">
          ♜♞♝♛♚♝♞♜
        </div>
      </div>
    </div>
  );
}