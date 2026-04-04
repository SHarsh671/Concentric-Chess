import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import React from "react";

// ---------------------------------------------------------------------------
// Mock server actions so useActionState doesn't call real DB
// ---------------------------------------------------------------------------
vi.mock("@/actions/auth", () => ({
  logout: vi.fn(),
  updateUsername: vi.fn(),
  updateEmail: vi.fn(),
  updatePassword: vi.fn(),
}));

import SettingsPage from "./inner";

describe("SettingsPage – account & profile interface (§8.2.5)", () => {
  afterEach(cleanup);
  // ── Form fields ──────────────────────────────────────────────────────────

  describe("form fields", () => {
    it("renders the Update Username form with username and password inputs", () => {
      render(<SettingsPage />);
      expect(
        screen.getByRole("textbox", { name: /new username/i }),
      ).toBeInTheDocument();
      // password inputs are type="password", not in accessible role "textbox"
      const pwInputs = document.querySelectorAll('input[type="password"]');
      expect(pwInputs.length).toBeGreaterThan(0);
    });

    it("renders the Update Email form with an email input", () => {
      render(<SettingsPage />);
      expect(
        screen.getByRole("textbox", { name: /new email/i }),
      ).toBeInTheDocument();
    });

    it("renders Update Username, Update Email, and Update Password submit buttons", () => {
      render(<SettingsPage />);
      expect(
        screen.getAllByRole("button", { name: /update username/i }).length,
      ).toBeGreaterThan(0);
      expect(
        screen.getAllByRole("button", { name: /update email/i }).length,
      ).toBeGreaterThan(0);
      expect(
        screen.getAllByRole("button", { name: /update password/i }).length,
      ).toBeGreaterThan(0);
    });
  });

  // ── Logout ───────────────────────────────────────────────────────────────

  it("renders a Logout button", () => {
    render(<SettingsPage />);
    expect(
      screen.getAllByRole("button", { name: /logout/i }).length,
    ).toBeGreaterThan(0);
  });

  // ── Error / feedback display (§8 Account & Profile) ─────────────────────

  it("does not show an error alert when there is no action error", () => {
    render(<SettingsPage />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
