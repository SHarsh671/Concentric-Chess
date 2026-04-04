/**
 * §8.2.1 – Navigation & Session Flow
 *
 * Verifies that the AppShell sidebar reflects authentication state:
 * unauthenticated → Sign Up + Log In links; authenticated → Settings link.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import React from "react";
import { render, screen, cleanup } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Mocks — installed before any imports that use them
// ---------------------------------------------------------------------------

vi.mock("server-only", () => ({}));

vi.mock("@/lib/auth", () => ({ getSession: vi.fn() }));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    [k: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/sidebar-close-on-navigate", () => ({
  SidebarCloseOnNavigate: () => null,
}));

// Stub every Sidebar primitive with a transparent div/span so the
// auth-conditional rendering inside AppShell is visible in the DOM.
vi.mock("@/components/ui/sidebar", () => {
  const pass =
    (Tag: keyof React.JSX.IntrinsicElements = "div") =>
    ({
      children,
      ...rest
    }: {
      children?: React.ReactNode;
      [k: string]: unknown;
    }) =>
      React.createElement(Tag, rest, children);

  return {
    SidebarProvider: pass("div"),
    Sidebar: pass("nav"),
    SidebarHeader: pass("header"),
    SidebarContent: pass("div"),
    SidebarMenu: pass("ul"),
    SidebarMenuItem: pass("li"),
    SidebarMenuButton: ({
      children,
      asChild: _asChild,
      ...rest
    }: {
      children?: React.ReactNode;
      asChild?: boolean;
      [k: string]: unknown;
    }) => React.createElement("span", rest, children),
    SidebarInset: pass("main"),
    SidebarRail: () => null,
    SidebarTrigger: () => <button>☰</button>,
  };
});

import { AppShell } from "@/components/app-shell";
import { getSession } from "@/lib/auth";

// ---------------------------------------------------------------------------

afterEach(cleanup);

describe("AppShell – navigation auth state (§8.2.1)", () => {
  it("shows Sign Up and Log In links when the user is not authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const jsx = await AppShell({ children: <div /> });
    render(jsx as React.ReactElement);

    expect(screen.getByRole("link", { name: /sign up/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /log in/i })).toBeInTheDocument();
  });

  it("does not show a Settings link when unauthenticated", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const jsx = await AppShell({ children: <div /> });
    render(jsx as React.ReactElement);

    expect(
      screen.queryByRole("link", { name: /settings/i }),
    ).not.toBeInTheDocument();
  });

  it("shows a Settings link when the user is authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue({
      playerId: "p1",
      token: "tok",
    } as Awaited<ReturnType<typeof getSession>>);
    const jsx = await AppShell({ children: <div /> });
    render(jsx as React.ReactElement);

    expect(screen.getByRole("link", { name: /settings/i })).toBeInTheDocument();
  });

  it("does not show Sign Up or Log In when authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue({
      playerId: "p1",
      token: "tok",
    } as Awaited<ReturnType<typeof getSession>>);
    const jsx = await AppShell({ children: <div /> });
    render(jsx as React.ReactElement);

    expect(
      screen.queryByRole("link", { name: /sign up/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /log in/i }),
    ).not.toBeInTheDocument();
  });

  it("always shows Play, History and Rules nav links regardless of auth state", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const jsx = await AppShell({ children: <div /> });
    render(jsx as React.ReactElement);

    expect(screen.getByRole("link", { name: /play/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /history/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /rules/i })).toBeInTheDocument();
  });

  it("renders children inside the shell", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const jsx = await AppShell({ children: <p data-testid="child">hello</p> });
    render(jsx as React.ReactElement);

    expect(screen.getByTestId("child")).toBeInTheDocument();
  });
});
