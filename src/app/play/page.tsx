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
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-foreground mb-4 text-balance">
            Start a New Game
          </h2>
          <p className="text-lg text-muted-foreground text-pretty">
            Choose a variant and play against players from around the world!
          </p>
        </div>

        {state?.error && (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertTitle>{state?.error}</AlertTitle>
          </Alert>
        )}

        <form action={formAction} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="flex flex-col gap-2 items-center">
              <Label htmlFor="variant">Select Game Variant</Label>
              <Select
                name="variant"
                defaultValue={state?.variant || GAME_VARIANTS[0].variant}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a variant" />
                </SelectTrigger>
                <SelectContent>
                  {GAME_VARIANTS.map((variant) => (
                    <SelectItem key={variant.variant} value={variant.variant}>
                      {variant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2 items-center">
              <Label htmlFor="mode">Select Game Mode</Label>
              <Select
                name="mode"
                defaultValue={mode}
                onValueChange={(value) => setMode(value as "online" | "local")}
                value={mode}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online Multiplayer</SelectItem>
                  <SelectItem value="local">Local Multiplayer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2 items-center">
              <Label htmlFor="opponent">Select Opponent</Label>
              {mode === "online" ? (
                <Input
                  type="text"
                  name="username"
                  placeholder="Opponent's username"
                  defaultValue={state?.mode === "online" ? state?.username : ""}
                />
              ) : (
                <div className="text-sm text-muted-foreground">N/A</div>
              )}
            </div>
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? <LoaderCircle className="size-5 animate-spin" /> : ""}
            Start Game
          </Button>
        </form>
      </div>
    </div>
  );
}
