import { describe, it, expect, vi } from "vitest";
import React from "react";

// ---------------------------------------------------------------------------
// Mock dependencies BEFORE importing the page
// ---------------------------------------------------------------------------
vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

// Mock the Inner component so the test stays focused on the page guard
vi.mock("./inner", () => ({
  default: () => <div data-testid="settings-inner" />,
}));

import SettingsPage from "./page";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { render, screen } from "@testing-library/react";

// ---------------------------------------------------------------------------

describe("Settings page – route protection (§8.2.1 Navigation & Auth)", () => {
  it("redirects unauthenticated users to /login", async () => {
    vi.mocked(getSession).mockResolvedValue(null);

    await SettingsPage();

    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("renders the settings inner component for authenticated users", async () => {
    vi.mocked(getSession).mockResolvedValue({
      playerId: "player-1",
      token: "tok",
    } as Awaited<ReturnType<typeof getSession>>);
    // redirect is mocked as a no-op, so rendering continues
    vi.mocked(redirect).mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });

    const jsx = await SettingsPage();
    const { unmount } = render(jsx as React.ReactElement);
    expect(screen.getByTestId("settings-inner")).toBeInTheDocument();
    unmount();
  });
});
