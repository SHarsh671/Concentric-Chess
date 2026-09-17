"use server";

import {
  checkEmail,
  checkPassword,
  checkUsername,
  getSession,
  hashPassword,
  loginWithUsername,
  registerPlayer,
  resetPasswordWithToken,
  sendEmailVerification,
  startPasswordReset,
  verifyEmailWithToken,
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
    console.error("Error during signup:", e);
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
    console.error("Error during login:", e);
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
    console.error("Error during logout:", e);
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
    const session = await getSession();
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
    console.error("Error updating username:", e);
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
    const session = await getSession();
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
    // update the email; changing it always resets verification status, since
    // we haven't confirmed the new address belongs to this player yet
    await db()
      .update(playersTable)
      .set({ email, emailVerifiedAt: null })
      .where(t.eq(playersTable.id, session.playerId));
    await sendEmailVerification(session.playerId, player.username, email);
  } catch (e) {
    console.error("Error updating email:", e);
    return {
      message: "An unexpected error occurred. Please try again.",
      email,
    };
  }

  revalidatePath("/settings", "layout");
  redirect("/settings");
}

export type ResendVerificationState = {
  message?: string;
  success?: boolean;
};

export async function resendVerificationEmail(): Promise<ResendVerificationState> {
  try {
    const session = await getSession();
    if (!session) {
      return { message: "You must be logged in to verify your email." };
    }
    const player = await db()
      .select()
      .from(playersTable)
      .where(t.eq(playersTable.id, session.playerId))
      .limit(1)
      .then((rows) => rows[0]);
    if (!player) {
      return { message: "Player not found." };
    }
    if (player.emailVerifiedAt) {
      return { message: "Your email is already verified." };
    }
    await sendEmailVerification(player.id, player.username, player.email);
  } catch (e) {
    console.error("Error resending verification email:", e);
    return { message: "An unexpected error occurred. Please try again." };
  }
  return { success: true };
}

export type VerifyEmailState = {
  message?: string;
  success?: boolean;
};

export async function verifyEmail(token: string): Promise<VerifyEmailState> {
  try {
    const error = await verifyEmailWithToken(token);
    if (error) {
      return { message: error };
    }
  } catch (e) {
    console.error("Error verifying email:", e);
    return { message: "An unexpected error occurred. Please try again." };
  }
  return { success: true };
}

export type ForgotPasswordState = {
  message?: string;
  success?: boolean;
  email?: string;
};

export async function forgotPassword(
  _prevState: ForgotPasswordState | null,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const email = (formData.get("email") as string).toLowerCase();
  if (!email) {
    return { message: "Please enter your email address.", email };
  }
  try {
    await startPasswordReset(email);
  } catch (e) {
    console.error("Error starting password reset:", e);
    return {
      message: "An unexpected error occurred. Please try again.",
      email,
    };
  }
  // always report success, whether or not the email exists, to avoid leaking
  // account existence
  return {
    success: true,
    email,
    message:
      "If an account with that email exists, we've sent a password reset link.",
  };
}

export type ResetPasswordState = {
  message?: string;
  success?: boolean;
};

export async function resetPassword(
  token: string,
  _prevState: ResetPasswordState | null,
  formData: FormData,
): Promise<ResetPasswordState> {
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirm_password") as string;

  if (password !== confirmPassword) {
    return { message: "Passwords do not match." };
  }

  const passwordCheck = await checkPassword(password);
  if (passwordCheck) {
    return { message: passwordCheck };
  }

  try {
    const error = await resetPasswordWithToken(token, password);
    if (error) {
      return { message: error };
    }
  } catch (e) {
    console.error("Error resetting password:", e);
    return { message: "An unexpected error occurred. Please try again." };
  }

  return { success: true };
}

export type UpdateMoveConfirmationState = {
  message?: string;
  success?: boolean;
};

export async function updateMoveConfirmation(
  _prevState: UpdateMoveConfirmationState | null,
  formData: FormData,
): Promise<UpdateMoveConfirmationState> {
  const requireMoveConfirmation =
    formData.get("requireMoveConfirmation") === "true" ? 1 : 0;

  try {
    const session = await getSession();
    if (!session) {
      return { message: "You must be logged in to update your settings." };
    }
    await db()
      .update(playersTable)
      .set({ requireMoveConfirmation })
      .where(t.eq(playersTable.id, session.playerId));
  } catch (e) {
    console.error("Error updating move confirmation:", e);
    return { message: "An unexpected error occurred. Please try again." };
  }

  revalidatePath("/settings", "layout");
  return { success: true };
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
    const session = await getSession();
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
    console.error("Error updating password:", e);
    return {
      message: "An unexpected error occurred. Please try again.",
    };
  }

  revalidatePath("/settings", "layout");
  redirect("/settings");
}
