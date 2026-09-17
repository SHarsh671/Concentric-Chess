"use client";

import {
  AlertCircleIcon,
  CheckCircle2,
  Gamepad,
  LoaderCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "./ui/button";
import { useActionState } from "react";
import { resetPassword } from "@/actions/auth";
import { Alert, AlertTitle } from "./ui/alert";
import Link from "next/link";

export function ResetPasswordForm({
  token,
  className,
  ...props
}: React.ComponentProps<"div"> & { token: string }) {
  const [state, formAction, pending] = useActionState(
    resetPassword.bind(null, token),
    null,
  );

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form action={formAction}>
        <FieldGroup className="gap-4">
          <div className="flex flex-col items-center gap-2 text-center">
            <Link
              href="/"
              className="flex flex-col items-center gap-2 font-medium"
            >
              <div className="flex size-8 items-center justify-center rounded-md">
                <Gamepad className="size-6" />
              </div>
              <span className="sr-only">Concentric Chess</span>
            </Link>
            <h1 className="text-xl font-bold">Choose a new password</h1>
          </div>
          {state?.message && (
            <Alert variant={state.success ? "default" : "destructive"}>
              {state.success ? <CheckCircle2 /> : <AlertCircleIcon />}
              <AlertTitle>{state.message}</AlertTitle>
            </Alert>
          )}
          {state?.success ? (
            <Field>
              <Button asChild>
                <Link href="/login">Log In</Link>
              </Button>
            </Field>
          ) : (
            <>
              <Field>
                <FieldLabel htmlFor="password">New Password</FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="********"
                  required
                  minLength={8}
                  maxLength={30}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="confirm_password">
                  Confirm New Password
                </FieldLabel>
                <Input
                  id="confirm_password"
                  name="confirm_password"
                  type="password"
                  placeholder="********"
                  required
                  minLength={8}
                  maxLength={30}
                />
              </Field>
              <Field>
                <Button type="submit" disabled={pending}>
                  {pending ? (
                    <LoaderCircle className="size-5 animate-spin" />
                  ) : (
                    ""
                  )}
                  Reset Password
                </Button>
              </Field>
            </>
          )}
        </FieldGroup>
      </form>
    </div>
  );
}
