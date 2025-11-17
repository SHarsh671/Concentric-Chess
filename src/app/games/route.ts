import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { gamesTable } from "shared";

export async function GET() {
  if (process.env.NODE_ENV === "development") {
    const games = await db().select().from(gamesTable);
    return Response.json(games);
  } else {
    redirect("/");
  }
}
