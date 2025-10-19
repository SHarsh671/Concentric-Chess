"use server";

import {
  checkEmail,
  checkPassword,
  checkUsername,
  loginWithUsername,
  registerPlayer,
} from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

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

  redirect("/");
}
