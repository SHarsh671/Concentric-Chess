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
import { signup } from "@/actions/auth";
import { Alert, AlertTitle } from "./ui/alert";

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [state, formAction, pending] = useActionState(signup, null);

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form action={formAction}>
        <FieldGroup className="gap-4">
          <div className="flex flex-col items-center gap-2 text-center">
            <a
              href="/"
              className="flex flex-col items-center gap-2 font-medium"
            >
              <div className="flex size-8 items-center justify-center rounded-md">
                <Gamepad className="size-6" />
              </div>
              <span className="sr-only">Concentric Chess</span>
            </a>
            <h1 className="text-xl font-bold">Welcome to Concentric Chess</h1>
            <FieldDescription>
              Already have an account? <a href="/login">Sign in</a>
            </FieldDescription>
          </div>
          {state?.message && (
            <Alert variant="destructive">
              <AlertCircleIcon />
              <AlertTitle>{state.message}</AlertTitle>
            </Alert>
          )}
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
            <div className="flex flex-col gap-1">
              <FieldLabel htmlFor="username">Username</FieldLabel>
              <FieldDescription className="text-xs">
                Username must be 3-20 characters long and contain only
                alphanumeric characters and underscores.
              </FieldDescription>
            </div>
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
            <div className="flex flex-col gap-1">
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <FieldDescription className="text-xs">
                Password must be between 8 and 30 characters long.
              </FieldDescription>
            </div>
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
            <FieldLabel htmlFor="confirm-password">Confirm Password</FieldLabel>
            <Input
              id="confirm-password"
              name="confirm-password"
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
              Create Account
            </Button>
          </Field>
        </FieldGroup>
      </form>
      {/* <FieldDescription className="px-6 text-center"> */}
      {/*   By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "} */}
      {/*   and <a href="#">Privacy Policy</a>. */}
      {/* </FieldDescription> */}
    </div>
  );
}
