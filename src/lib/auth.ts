import { cookies } from "next/headers";
import "server-only";
import { db } from "./db";
import * as t from "drizzle-orm";
import { playersTable, Session, sessionsTable } from "shared";
import bcrypt from "bcryptjs";

let _session: Session | undefined | null = undefined;

export async function getSession(): Promise<Session | null> {
  if (_session === undefined) {
    _session = await verifySession();
  }
  return _session;
}

export async function verifySession(session?: string): Promise<Session | null> {
  // if we don't have a session, then we need to get it from the request
  const token = session ?? (await cookies()).get("session_token")?.value;
  if (!token) {
    return null;
  }
  return (
    (await db().query.sessionsTable.findFirst({
      where: t.and(
        t.eq(sessionsTable.token, token),
        t.gt(sessionsTable.expiresAt, new Date().toISOString()),
      ),
    })) ?? null
  );
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export async function logout(): Promise<void> {
  const token = (await cookies()).get("session_token")?.value;
  if (token) {
    await db().delete(sessionsTable).where(t.eq(sessionsTable.token, token));
  }
}

export async function loginWithUsername(
  username: string,
  password: string,
): Promise<Session | undefined> {
  const player = await db().query.playersTable.findFirst({
    where: t.eq(playersTable.username, username.toLowerCase()),
  });
  if (!player) {
    return undefined;
  }
  const isValid = await verifyPassword(password, player.password);
  if (!isValid) {
    return undefined;
  }
  const token = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
  const session: Session = {
    id: crypto.randomUUID(),
    playerId: player.id,
    token,
    expiresAt: expiresAt.toISOString(),
    createdAt: new Date().toISOString(),
  };
  await db().insert(sessionsTable).values(session);
  return session;
}

// user names MUST be 3-20 characters long and contain only alphanumeric characters and underscores
// email must be a valid email address
// password must be 8-30 characters long
export async function registerPlayer(
  username: string,
  email: string,
  password: string,
): Promise<Session> {
  const hashedPassword = await hashPassword(password);
  const playerId = crypto.randomUUID();
  await db().insert(playersTable).values({
    id: playerId,
    username: username.toLowerCase(),
    email,
    password: hashedPassword,
    createdAt: new Date().toISOString(),
  });
  const token = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
  const session: Session = {
    id: crypto.randomUUID(),
    playerId,
    token,
    expiresAt: expiresAt.toISOString(),
    createdAt: new Date().toISOString(),
  };
  await db().insert(sessionsTable).values(session);
  return session;
}

export async function checkUsername(
  username: string,
): Promise<string | undefined> {
  // first, we check if the username is valid
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  if (!usernameRegex.test(username)) {
    return "Username must be 3-20 characters long and contain only alphanumeric characters and underscores.";
  }
  // then, we check if the username is already taken
  const existingPlayer = await db().query.playersTable.findFirst({
    where: t.eq(playersTable.username, username.toLowerCase()),
  });
  if (existingPlayer) {
    return "Username is already taken.";
  }
  return undefined;
}

export async function checkEmail(email: string): Promise<string | undefined> {
  // first, we check if the email is valid
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return "Email must be a valid email address.";
  }
  // then, we check if the email is already taken
  const existingPlayer = await db().query.playersTable.findFirst({
    where: t.eq(playersTable.email, email.toLowerCase()),
  });
  if (existingPlayer) {
    return "Email is already taken.";
  }
  return undefined;
}

export async function checkPassword(
  password: string,
): Promise<string | undefined> {
  if (password.length < 8 || password.length > 30) {
    return "Password must be between 8 and 30 characters long.";
  }
  return undefined;
}
