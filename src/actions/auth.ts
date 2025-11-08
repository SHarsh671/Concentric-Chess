"use server";

import {
  checkEmail,
  checkPassword,
  checkUsername,
  hashPassword,
  loginWithUsername,
  registerPlayer,
  verifyPassword,
} from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { playersTable, sessionsTable } from "shared";
import * as t from "drizzle-orm";

export type SignupState = {
  message: string;
  email?: string;
  username?: string;
};

export async function signup(
  _prevState: SignupState | null,
  formData: FormData,
): Promise<SignupState> {
  const email = (formData.get("email") as string).toLowerCase();
  const username = (formData.get("username") as string).toLowerCase();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirm-password") as string;
  if (password !== confirmPassword) {
    return {
      message: "Passwords do not match.",
      email,
      username,
    };
  }
  const usernameCheck = await checkUsername(username);
  if (usernameCheck) {
    return {
      message: usernameCheck,
      email,
      username,
    };
  }
  const emailCheck = await checkEmail(email);
  if (emailCheck) {
    return {
      message: emailCheck,
      email,
      username,
    };
  }
  const passwordCheck = await checkPassword(password);
  if (passwordCheck) {
    return {
      message: passwordCheck,
      email,
      username,
    };
  }

  try {
    const session = await registerPlayer(username, email, password);
    (await cookies()).set("session_token", session.token, {
      httpOnly: true,
      path: "/",
      secure: true,
      sameSite: "lax",
      expires: new Date(session.expiresAt),
    });
  } catch (e) {
    return {
      message: "An unexpected error occurred. Please try again.",
      email,
      username,
    };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export type LoginState = {
  message: string;
  username?: string;
};

export async function login(
  _prevState: LoginState | null,
  formData: FormData,
): Promise<LoginState> {
  const username = (formData.get("username") as string).toLowerCase();
  const password = formData.get("password") as string;

  try {
    const session = await loginWithUsername(username, password);
    if (!session) {
      return {
        message: "Invalid username or password.",
        username,
      };
    }
    (await cookies()).set("session_token", session.token, {
      httpOnly: true,
      path: "/",
      secure: true,
      sameSite: "lax",
      expires: new Date(session.expiresAt),
    });
  } catch (e) {
    return {
      message: "An unexpected error occurred. Please try again.",
      username,
    };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function logout(): Promise<{ message: string }> {
  try {
    const token = (await cookies()).get("session_token")?.value;
    if (token) {
      await db().delete(sessionsTable).where(t.eq(sessionsTable.token, token));
    }
    (await cookies()).set("session_token", "", {
      httpOnly: true,
      path: "/",
      secure: true,
      sameSite: "lax",
      expires: new Date(0),
    });
  } catch (e) {
    return {
      message: "An unexpected error occurred. Please try again.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export type UpdateUsernameState = {
  message: string;
  username?: string;
};

export async function updateUsername(
  _prevState: UpdateUsernameState | null,
  formData: FormData,
): Promise<UpdateUsernameState> {
  const username = (formData.get("username") as string).toLowerCase();
  const password = formData.get("password") as string;

  const usernameCheck = await checkUsername(username);
  if (usernameCheck) {
    return {
      message: usernameCheck,
      username,
    };
  }

  try {
    const sessionToken = (await cookies()).get("session_token")?.value;
    if (!sessionToken) {
      return {
        message: "You must be logged in to change your username.",
        username,
      };
    }
    const session = await db()
      .select()
      .from(sessionsTable)
      .where(t.eq(sessionsTable.token, sessionToken))
      .limit(1)
      .then((rows) => rows[0]);
    if (!session) {
      return {
        message: "You must be logged in to change your username.",
        username,
      };
    }
    // check if the new username is the same as the current one
    const player = await db()
      .select()
      .from(playersTable)
      .where(t.eq(playersTable.id, session.playerId))
      .limit(1)
      .then((rows) => rows[0]);
    // verify the password
    const passwordValid = await verifyPassword(password, player.password);
    if (!passwordValid) {
      return {
        message: "Invalid password.",
        username,
      };
    }
    // update the username
    await db()
      .update(playersTable)
      .set({ username })
      .where(t.eq(playersTable.id, session.playerId));
  } catch (e) {
    return {
      message: "An unexpected error occurred. Please try again.",
      username,
    };
  }

  revalidatePath("/settings", "layout");
  redirect("/settings");
}

export type UpdateEmailState = {
  message: string;
  email?: string;
};

export async function updateEmail(
  _prevState: UpdateEmailState | null,
  formData: FormData,
): Promise<UpdateEmailState> {
  const email = (formData.get("email") as string).toLowerCase();
  const password = formData.get("password") as string;

  const emailCheck = await checkEmail(email);
  if (emailCheck) {
    return {
      message: emailCheck,
      email,
    };
  }

  try {
    const sessionToken = (await cookies()).get("session_token")?.value;
    if (!sessionToken) {
      return {
        message: "You must be logged in to change your email.",
        email,
      };
    }
    const session = await db()
      .select()
      .from(sessionsTable)
      .where(t.eq(sessionsTable.token, sessionToken))
      .limit(1)
      .then((rows) => rows[0]);
    if (!session) {
      return {
        message: "You must be logged in to change your email.",
        email,
      };
    }
    const player = await db()
      .select()
      .from(playersTable)
      .where(t.eq(playersTable.id, session.playerId))
      .limit(1)
      .then((rows) => rows[0]);
    // verify the password
    const passwordValid = await verifyPassword(password, player.password);
    if (!passwordValid) {
      return {
        message: "Invalid password.",
        email,
      };
    }
    // update the email
    await db()
      .update(playersTable)
      .set({ email })
      .where(t.eq(playersTable.id, session.playerId));
  } catch (e) {
    return {
      message: "An unexpected error occurred. Please try again.",
      email,
    };
  }

  revalidatePath("/settings", "layout");
  redirect("/settings");
}

export type UpdatePasswordState = {
  message: string;
};

export async function updatePassword(
  _prevState: UpdatePasswordState | null,
  formData: FormData,
): Promise<UpdatePasswordState> {
  const currentPassword = formData.get("password") as string;
  const newPassword = formData.get("new_password") as string;
  const confirmNewPassword = formData.get("confirm_password") as string;

  if (newPassword !== confirmNewPassword) {
    return {
      message: "New passwords do not match.",
    };
  }

  const passwordCheck = await checkPassword(newPassword);
  if (passwordCheck) {
    return {
      message: passwordCheck,
    };
  }

  try {
    const sessionToken = (await cookies()).get("session_token")?.value;
    if (!sessionToken) {
      return {
        message: "You must be logged in to change your password.",
      };
    }
    const session = await db()
      .select()
      .from(sessionsTable)
      .where(t.eq(sessionsTable.token, sessionToken))
      .limit(1)
      .then((rows) => rows[0]);
    if (!session) {
      return {
        message: "You must be logged in to change your password.",
      };
    }
    const player = await db()
      .select()
      .from(playersTable)
      .where(t.eq(playersTable.id, session.playerId))
      .limit(1)
      .then((rows) => rows[0]);
    // verify the current password
    const passwordValid = await verifyPassword(
      currentPassword,
      player.password,
    );
    if (!passwordValid) {
      return {
        message: "Invalid current password.",
      };
    }
    // update the password
    const hashedNewPassword = await hashPassword(newPassword);
    await db()
      .update(playersTable)
      .set({ password: hashedNewPassword })
      .where(t.eq(playersTable.id, session.playerId));
  } catch (e) {
    return {
      message: "An unexpected error occurred. Please try again.",
    };
  }

  revalidatePath("/settings", "layout");
  redirect("/settings");
}
