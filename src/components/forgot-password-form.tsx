"use client";

import {
  AlertCircleIcon,
  CheckCircle2,
  Gamepad,
  LoaderCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "./ui/button";
import { useActionState } from "react";
import { forgotPassword } from "@/actions/auth";
import { Alert, AlertTitle } from "./ui/alert";
import Link from "next/link";

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [state, formAction, pending] = useActionState(forgotPassword, null);

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
            <h1 className="text-xl font-bold">Reset your password</h1>
            <FieldDescription>
              Remembered your password? <a href="/login">Log in</a>
            </FieldDescription>
          </div>
          {state?.message && (
            <Alert variant={state.success ? "default" : "destructive"}>
              {state.success ? <CheckCircle2 /> : <AlertCircleIcon />}
              <AlertTitle>{state.message}</AlertTitle>
            </Alert>
          )}
          {!state?.success && (
            <>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  defaultValue={state?.email || ""}
                />
              </Field>
              <Field>
                <Button type="submit" disabled={pending}>
                  {pending ? (
                    <LoaderCircle className="size-5 animate-spin" />
                  ) : (
                    ""
                  )}
                  Send Reset Link
                </Button>
              </Field>
            </>
          )}
        </FieldGroup>
      </form>
    </div>
  );
}
