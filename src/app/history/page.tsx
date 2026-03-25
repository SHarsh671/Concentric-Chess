import Link from "next/link";
import * as t from "drizzle-orm";
import { GAME_VARIANTS, gamesTable } from "shared";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Play } from "lucide-react";

const PAGE_SIZE = 25;
const ONE_MINUTE_MS = 60 * 1000;
const ONE_HOUR_MS = 60 * ONE_MINUTE_MS;
const ONE_DAY_MS = 24 * ONE_HOUR_MS;
const ONE_WEEK_MS = 7 * ONE_DAY_MS;

const variantNameMap = new Map(
  GAME_VARIANTS.map((variant) => [variant.variant, variant.name]),
);

function formatVariantName(variant: string): string {
  return (
    variantNameMap.get(variant as (typeof GAME_VARIANTS)[number]["variant"]) ??
    variant
  );
}

function formatWhen(lastMoveAt: string | null): string {
  if (!lastMoveAt) return "-";

  const then = new Date(lastMoveAt).getTime();
  if (Number.isNaN(then)) return "-";

  const delta = Date.now() - then;
  if (delta < ONE_WEEK_MS) {
    if (delta < ONE_HOUR_MS) {
      const minutes = Math.max(1, Math.floor(delta / ONE_MINUTE_MS));
      return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
    }
    if (delta < ONE_DAY_MS) {
      const hours = Math.max(1, Math.floor(delta / ONE_HOUR_MS));
      return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    }
    const days = Math.max(1, Math.floor(delta / ONE_DAY_MS));
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }

  return new Date(lastMoveAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type HistoryPageProps = {
  searchParams?: Promise<{ page?: string }>;
};

export default async function HistoryPage({ searchParams }: HistoryPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const requestedPage = Number.parseInt(resolvedSearchParams.page ?? "1", 10);
  const normalizedPage = Number.isNaN(requestedPage)
    ? 1
    : Math.max(1, requestedPage);
  const session = await getSession();

  const [{ value: totalFinishedRaw }] = await db()
    .select({ value: t.count() })
    .from(gamesTable)
    .where(
      t.and(t.isNull(gamesTable.deletedAt), t.ne(gamesTable.status, "ongoing")),
    );

  const totalFinishedGames = Number(totalFinishedRaw ?? 0);
  const totalPages = Math.max(1, Math.ceil(totalFinishedGames / PAGE_SIZE));
  const currentPage = Math.min(normalizedPage, totalPages);
  const offset = (currentPage - 1) * PAGE_SIZE;

  const games = await db().query.gamesTable.findMany({
    where: (game, { and, isNull, ne }) =>
      and(isNull(game.deletedAt), ne(game.status, "ongoing")),
    orderBy: (game, { desc }) => [desc(game.lastMoveAt)],
    limit: PAGE_SIZE,
    offset,
  });

  const gamesWithDetails = await Promise.all(
    games.map(async (g) => {
      const [whitePlayer, blackPlayer] = await Promise.all([
        db().query.playersTable.findFirst({
          where: (p, { eq }) => eq(p.id, g.whitePlayerId!),
        }),
        db().query.playersTable.findFirst({
          where: (p, { eq }) => eq(p.id, g.blackPlayerId!),
        }),
      ]);

      return {
        game: g,
        didUserPlay:
          session?.playerId === g.whitePlayerId ||
          session?.playerId === g.blackPlayerId,
        isUserWhite: session?.playerId === g.whitePlayerId,
        whiteUsername: whitePlayer?.username ?? "Unknown",
        blackUsername: blackPlayer?.username ?? "Unknown",
      };
    }),
  );

  if (gamesWithDetails.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="container mx-auto max-w-4xl">
          <div className="rounded-xl border-2 border-black bg-white p-8 text-center shadow-[0_6px_0_0_rgba(0,0,0,1)]">
            <h1 className="text-3xl font-bold mb-4">GAME HISTORY</h1>
            <p className="text-gray-600">No finished games found.</p>
          </div>
        </div>
      </div>
    );
  }

  const pageStart = offset + 1;
  const pageEnd = offset + gamesWithDetails.length;
  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;
  const previousPageHref =
    currentPage - 1 === 1 ? "/history" : `/history?page=${currentPage - 1}`;
  const nextPageHref = `/history?page=${currentPage + 1}`;

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-100 to-gray-50 p-3 md:p-4">
      <div className="container mx-auto max-w-5xl space-y-4">
        <div className="rounded-xl border-2 border-black bg-linear-to-r from-white to-gray-100 p-4 shadow-[0_6px_0_0_rgba(0,0,0,1)]">
          <h1 className="text-xl font-black uppercase tracking-wide text-black md:text-2xl">
            Match History
          </h1>
          <p className="mt-1 text-xs text-gray-700 md:text-sm">
            Showing {pageStart}-{pageEnd} of {totalFinishedGames} finished games
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-black/20 pt-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-600 md:text-xs">
              Page {currentPage} of {totalPages}
            </p>

            <div className="flex items-center gap-2">
              <Button
                asChild={hasPreviousPage}
                variant="outline"
                size="sm"
                className="h-8 border-2 border-black px-3 text-xs font-bold uppercase"
                disabled={!hasPreviousPage}
              >
                {hasPreviousPage ? (
                  <Link href={previousPageHref}>Previous</Link>
                ) : (
                  <span>Previous</span>
                )}
              </Button>

              <Button
                asChild={hasNextPage}
                size="sm"
                className="h-8 border-2 border-black bg-black px-3 text-xs font-bold uppercase text-white hover:bg-gray-800"
                disabled={!hasNextPage}
              >
                {hasNextPage ? (
                  <Link href={nextPageHref}>Next</Link>
                ) : (
                  <span>Next</span>
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border-2 border-black bg-white shadow-[0_6px_0_0_rgba(0,0,0,1)]">
          <div className="hidden md:block">
            <Table className="text-sm">
              <TableHeader>
                <TableRow className="border-b-2 border-black bg-black text-white hover:bg-black">
                  <TableHead className="h-12 px-4 text-sm font-bold uppercase text-white">
                    Match
                  </TableHead>
                  <TableHead className="h-12 px-4 text-sm font-bold uppercase text-white">
                    Variant
                  </TableHead>
                  <TableHead className="h-12 px-4 text-sm font-bold uppercase text-white">
                    Result
                  </TableHead>
                  <TableHead className="h-12 px-4 text-sm font-bold uppercase text-white">
                    Date
                  </TableHead>
                  <TableHead className="h-12 px-4 text-right text-sm font-bold uppercase text-white">
                    Replay
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gamesWithDetails.map(
                  (
                    {
                      game,
                      didUserPlay,
                      isUserWhite,
                      whiteUsername,
                      blackUsername,
                    },
                    index,
                  ) => {
                    const resultText =
                      game.status === "draw"
                        ? "Draw"
                        : didUserPlay
                          ? (game.status === "white_win" ||
                              game.status === "black_resign") === isUserWhite
                            ? "You won"
                            : "Opponent won"
                          : game.status === "white_win" ||
                              game.status === "black_resign"
                            ? `${whiteUsername} won`
                            : `${blackUsername} won`;

                    return (
                      <TableRow
                        key={game.id}
                        className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        <TableCell className="px-4 py-3 text-sm">
                          <Link
                            href={`/games/${game.id}`}
                            className="font-semibold text-black hover:underline"
                          >
                            {whiteUsername} vs {blackUsername}
                          </Link>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm font-medium text-gray-700">
                          {formatVariantName(game.variant)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm font-semibold text-gray-900">
                          {resultText}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm text-gray-700">
                          {formatWhen(game.lastMoveAt)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right">
                          <Button
                            asChild
                            size="sm"
                            className="h-8 border-2 border-black bg-black px-3 text-xs font-bold uppercase text-white hover:bg-gray-800"
                          >
                            <Link href={`/replay/${game.id}`}>
                              <Play className="mr-1 h-3.5 w-3.5" />
                              Replay
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  },
                )}
              </TableBody>
            </Table>
          </div>

          <div className="divide-y divide-gray-200 md:hidden">
            {gamesWithDetails.map(
              ({
                game,
                didUserPlay,
                isUserWhite,
                whiteUsername,
                blackUsername,
              }) => {
                const resultText =
                  game.status === "draw"
                    ? "Draw"
                    : didUserPlay
                      ? (game.status === "white_win" ||
                          game.status === "black_resign") === isUserWhite
                        ? "You won"
                        : "Opponent won"
                      : game.status === "white_win" ||
                          game.status === "black_resign"
                        ? `${whiteUsername} won`
                        : `${blackUsername} won`;

                return (
                  <div key={game.id} className="bg-white p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link
                          href={`/games/${game.id}`}
                          className="text-base font-bold text-black hover:underline"
                        >
                          {whiteUsername} vs {blackUsername}
                        </Link>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-gray-700">
                          <span className="font-medium">
                            {formatVariantName(game.variant)}
                          </span>
                          <span>•</span>
                          <span className="font-semibold">{resultText}</span>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">
                          {formatWhen(game.lastMoveAt)}
                        </p>
                      </div>
                      <Button
                        asChild
                        size="sm"
                        className="h-8 border-2 border-black bg-black px-2.5 text-xs font-bold uppercase text-white hover:bg-gray-800"
                      >
                        <Link href={`/replay/${game.id}`}>
                          <Play className="mr-1 h-3.5 w-3.5" />
                          Replay
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border-2 border-black bg-white p-3 shadow-[0_4px_0_0_rgba(0,0,0,1)]">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-700 md:text-xs">
            Page {currentPage} of {totalPages}
          </p>

          <div className="flex gap-2">
            <Button
              asChild={hasPreviousPage}
              variant="outline"
              size="sm"
              className="h-8 border-2 border-black px-3 text-xs font-bold uppercase"
              disabled={!hasPreviousPage}
            >
              {hasPreviousPage ? (
                <Link href={previousPageHref}>Previous</Link>
              ) : (
                <span>Previous</span>
              )}
            </Button>

            <Button
              asChild={hasNextPage}
              size="sm"
              className="h-8 border-2 border-black bg-black px-3 text-xs font-bold uppercase text-white hover:bg-gray-800"
              disabled={!hasNextPage}
            >
              {hasNextPage ? (
                <Link href={nextPageHref}>Next</Link>
              ) : (
                <span>Next</span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
