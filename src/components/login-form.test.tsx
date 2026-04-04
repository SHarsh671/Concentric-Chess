import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "./login-form";

// Next.js Link and useActionState need lightweight stubs in jsdom
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useActionState: vi.fn((_action: unknown, initial: unknown) => [initial, vi.fn(), false]),
  };
});

describe("LoginForm", () => {
  it("renders username and password inputs", () => {
    render(<LoginForm />);
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("renders a Log In submit button", () => {
    render(<LoginForm />);
    // The submit button renders "Log In" as its text
    const buttons = screen.getAllByRole("button");
    const logInBtn = buttons.find((b) => /log.?in/i.test(b.textContent ?? ""));
    expect(logInBtn).toBeTruthy();
  });

  it("renders a link to the sign-up page", () => {
    render(<LoginForm />);
    const links = screen.getAllByRole("link", { name: /sign up/i });
    expect(links.length).toBeGreaterThan(0);
    expect(links[0]).toHaveAttribute("href", "/signup");
  });

  it("username input has correct constraints", () => {
    render(<LoginForm />);
    const input = screen.getByLabelText(/username/i);
    expect(input).toHaveAttribute("required");
    expect(input).toHaveAttribute("minLength", "3");
    expect(input).toHaveAttribute("maxLength", "20");
    expect(input).toHaveAttribute("pattern", "^[a-zA-Z0-9_]{3,20}$");
  });

  it("password input is of type password", () => {
    render(<LoginForm />);
    expect(screen.getByLabelText(/password/i)).toHaveAttribute("type", "password");
  });

  it("does not show error banner when there is no error state", () => {
    render(<LoginForm />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows error alert when action state has a message", async () => {
    const { useActionState } = await import("react");
    (useActionState as ReturnType<typeof vi.fn>).mockReturnValueOnce([
      { message: "Invalid credentials" },
      vi.fn(),
      false,
    ]);
    render(<LoginForm />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
  });
});
