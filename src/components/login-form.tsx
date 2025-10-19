"use client";

import { AlertCircleIcon, Gamepad, LoaderCircle } from "lucide-react";

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
import { login } from "@/actions/auth";
import { Alert, AlertTitle } from "./ui/alert";
import Link from "next/link";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [state, formAction, pending] = useActionState(login, null);

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
            <h1 className="text-xl font-bold">Welcome to Concentric Chess</h1>
            <FieldDescription>
              Don't have an account? <a href="/signup">Sign up</a>
            </FieldDescription>
          </div>
          {state?.message && (
            <Alert variant="destructive">
              <AlertCircleIcon />
              <AlertTitle>{state.message}</AlertTitle>
            </Alert>
          )}
          <Field>
            <FieldLabel htmlFor="username">Username</FieldLabel>
            <Input
              id="username"
              name="username"
              type="text"
              placeholder="yourusername"
              required
              minLength={3}
              maxLength={20}
              pattern="^[a-zA-Z0-9_]{3,20}$"
              defaultValue={state?.username || ""}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
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
            <Button type="submit" disabled={pending}>
              {pending ? <LoaderCircle className="size-5 animate-spin" /> : ""}
              Log In
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </div>
  );
}
