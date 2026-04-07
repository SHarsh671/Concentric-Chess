"use client";

import type React from "react";
import { AlertCircleIcon, LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  logout,
  updateEmail,
  updateMoveConfirmation,
  updatePassword,
  updateUsername,
} from "@/actions/auth";
import { useActionState, useEffect } from "react";
import { Alert, AlertTitle } from "@/components/ui/alert";

export default function SettingsPage({
  requireMoveConfirmation,
}: {
  requireMoveConfirmation: boolean;
}) {
  const [logoutState, logoutAction, logoutPending] = useActionState(
    logout,
    null,
  );
  const [usernameState, updateUsernameAction, usernamePending] = useActionState(
    updateUsername,
    null,
  );
  const [emailState, updateEmailAction, emailPending] = useActionState(
    updateEmail,
    null,
  );
  const [passwordState, updatePasswordAction, passwordPending] = useActionState(
    updatePassword,
    null,
  );
  const [moveConfirmationState, updateMoveConfirmationAction] = useActionState(
    updateMoveConfirmation,
    null,
  );

  useEffect(() => {
    if (moveConfirmationState?.success) {
      toast.success("Preferences saved.");
    }
  }, [moveConfirmationState]);

  const message =
    passwordState?.message ||
    emailState?.message ||
    usernameState?.message ||
    logoutState?.message ||
    moveConfirmationState?.message;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground mt-2">
              Manage your account settings and security preferences
            </p>
          </div>
          <div>
            <form action={logoutAction}>
              <Button
                variant="destructive"
                type="submit"
                disabled={logoutPending}
              >
                {logoutPending ? (
                  <LoaderCircle className="size-5 animate-spin" />
                ) : (
                  ""
                )}
                Logout
              </Button>
            </form>
          </div>
        </div>

        {message && (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertTitle>{message}</AlertTitle>
          </Alert>
        )}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Update Username</CardTitle>
              <CardDescription>
                Change your username. You&apos;ll need to verify with your
                current password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={updateUsernameAction} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">New Username</Label>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="Enter new username"
                    defaultValue={usernameState?.username || ""}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username_password">Current Password</Label>
                  <Input
                    id="username_password"
                    name="password"
                    type="password"
                    placeholder="Enter current password"
                    required
                  />
                </div>
                <Button type="submit" disabled={usernamePending}>
                  {logoutPending ? (
                    <LoaderCircle className="size-5 animate-spin" />
                  ) : (
                    ""
                  )}
                  Update Username
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Update Email</CardTitle>
              <CardDescription>
                Change your email address. You&apos;ll need to verify with your
                current password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={updateEmailAction} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">New Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter new email"
                    defaultValue={emailState?.email || ""}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email_password">Current Password</Label>
                  <Input
                    id="email-password"
                    name="password"
                    type="password"
                    placeholder="Enter current password"
                    required
                  />
                </div>
                <Button type="submit" disabled={emailPending}>
                  {logoutPending ? (
                    <LoaderCircle className="size-5 animate-spin" />
                  ) : (
                    ""
                  )}
                  Update Email
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Update Password</CardTitle>
              <CardDescription>
                Change your password. Make sure to use a strong, unique
                password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={updatePasswordAction} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Current Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter current password"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new_password">New Password</Label>
                  <Input
                    id="new_password"
                    name="new_password"
                    type="password"
                    placeholder="Enter new password"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Confirm New Password</Label>
                  <Input
                    id="confirm_password"
                    name="confirm_password"
                    type="password"
                    placeholder="Confirm new password"
                    required
                  />
                </div>
                <Button type="submit" disabled={passwordPending}>
                  {logoutPending ? (
                    <LoaderCircle className="size-5 animate-spin" />
                  ) : (
                    ""
                  )}
                  Update Password
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Game Preferences</CardTitle>
              <CardDescription>
                Customize how you interact with the board during games.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={updateMoveConfirmationAction} className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="requireMoveConfirmation">
                      Move confirmation
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Require a second click to confirm each move.
                    </p>
                  </div>
                  <Switch
                    id="requireMoveConfirmation"
                    name="requireMoveConfirmation"
                    defaultChecked={requireMoveConfirmation}
                    value="true"
                  />
                </div>
                <input
                  type="hidden"
                  name="requireMoveConfirmation"
                  value="false"
                />
                <Button type="submit">Save Preferences</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
