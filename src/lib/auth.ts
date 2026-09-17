import { cookies } from "next/headers";
import "server-only";
import { db } from "./db";
import * as t from "drizzle-orm";
import {
  emailVerificationTokensTable,
  passwordResetTokensTable,
  Player,
  playersTable,
  Session,
  sessionsTable,
} from "shared";
import bcrypt from "bcryptjs";
import { sendPasswordResetEmail, sendVerificationEmail } from "./email";

export async function getSession(): Promise<Session | null> {
  return await verifySession();
}

export async function verifySession(session?: string): Promise<Session | null> {
  // if we don't have a session, then we need to get it from the request
  const token = session ?? (await cookies()).get("session_token")?.value;
  if (!token) {
    return null;
  }
  const results = await db()
    .select()
    .from(sessionsTable)
    .where(
      t.and(
        t.eq(sessionsTable.token, token),
        t.gt(sessionsTable.expiresAt, new Date().toISOString()),
      ),
    )
    .limit(1);
  if (results.length === 0) {
    return null;
  }
  return results[0];
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
    emailVerifiedAt: null,
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
  await sendEmailVerification(playerId, username.toLowerCase(), email);
  return session;
}

// creates a fresh verification token for the given email and sends it
export async function sendEmailVerification(
  playerId: string,
  username: string,
  email: string,
): Promise<void> {
  const token = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);
  await db().insert(emailVerificationTokensTable).values({
    id: crypto.randomUUID(),
    playerId,
    token,
    email,
    expiresAt: expiresAt.toISOString(),
    usedAt: null,
  });
  await sendVerificationEmail(email, username, token);
}

// returns undefined on success, or an error message
export async function verifyEmailWithToken(
  token: string,
): Promise<string | undefined> {
  const record = await db().query.emailVerificationTokensTable.findFirst({
    where: t.eq(emailVerificationTokensTable.token, token),
  });
  if (!record) {
    return "Invalid or expired verification link.";
  }
  if (record.usedAt || new Date(record.expiresAt) < new Date()) {
    return "This verification link has expired or already been used.";
  }
  const player = await db().query.playersTable.findFirst({
    where: t.eq(playersTable.id, record.playerId),
  });
  if (!player || player.email !== record.email) {
    // the player's email changed since this token was issued
    return "This verification link is no longer valid.";
  }
  await db()
    .update(playersTable)
    .set({ emailVerifiedAt: new Date().toISOString() })
    .where(t.eq(playersTable.id, record.playerId));
  await db()
    .update(emailVerificationTokensTable)
    .set({ usedAt: new Date().toISOString() })
    .where(t.eq(emailVerificationTokensTable.id, record.id));
  return undefined;
}

export async function isEmailVerified(playerId: string): Promise<boolean> {
  const player = await db().query.playersTable.findFirst({
    where: t.eq(playersTable.id, playerId),
  });
  return !!player?.emailVerifiedAt;
}

// starts a password reset flow; always resolves without revealing whether the
// email exists, to avoid leaking account existence
export async function startPasswordReset(email: string): Promise<void> {
  const player = await db().query.playersTable.findFirst({
    where: t.eq(playersTable.email, email.toLowerCase()),
  });
  if (!player) {
    return;
  }
  const token = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1);
  await db().insert(passwordResetTokensTable).values({
    id: crypto.randomUUID(),
    playerId: player.id,
    token,
    expiresAt: expiresAt.toISOString(),
    usedAt: null,
  });
  await sendPasswordResetEmail(player.email, player.username, token);
}

// returns undefined on success, or an error message
export async function resetPasswordWithToken(
  token: string,
  newPassword: string,
): Promise<string | undefined> {
  const record = await db().query.passwordResetTokensTable.findFirst({
    where: t.eq(passwordResetTokensTable.token, token),
  });
  if (!record) {
    return "Invalid or expired reset link.";
  }
  if (record.usedAt || new Date(record.expiresAt) < new Date()) {
    return "This reset link has expired or already been used.";
  }
  const hashedPassword = await hashPassword(newPassword);
  await db()
    .update(playersTable)
    .set({ password: hashedPassword })
    .where(t.eq(playersTable.id, record.playerId));
  await db()
    .update(passwordResetTokensTable)
    .set({ usedAt: new Date().toISOString() })
    .where(t.eq(passwordResetTokensTable.id, record.id));
  // invalidate all existing sessions for security
  await db()
    .delete(sessionsTable)
    .where(t.eq(sessionsTable.playerId, record.playerId));
  return undefined;
}

export async function getPlayerById(
  playerId: string,
): Promise<Player | undefined> {
  return await db().query.playersTable.findFirst({
    where: t.eq(playersTable.id, playerId),
  });
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
  try {
    const existingPlayer = await db().query.playersTable.findFirst({
      where: t.eq(playersTable.username, username.toLowerCase()),
    });
    if (existingPlayer) {
      return "Username is already taken.";
    }
    return undefined;
  } catch (error) {
    console.error("Error checking username:", error);
    return "An error occurred while checking the username.";
  }
}

export async function checkEmail(email: string): Promise<string | undefined> {
  // first, we check if the email is valid
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return "Email must be a valid email address.";
  }
  try {
    // then, we check if the email is already taken
    const existingPlayer = await db().query.playersTable.findFirst({
      where: t.eq(playersTable.email, email.toLowerCase()),
    });
    if (existingPlayer) {
      return "Email is already taken.";
    }
    return undefined;
  } catch (error) {
    console.error("Error checking email:", error);
    return "An error occurred while checking the email.";
  }
}

export async function checkPassword(
  password: string,
): Promise<string | undefined> {
  if (password.length < 8 || password.length > 30) {
    return "Password must be between 8 and 30 characters long.";
  }
  return undefined;
}
