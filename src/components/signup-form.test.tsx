import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SignupForm } from "./signup-form";

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

describe("SignupForm", () => {
  it("renders username, email and password inputs", () => {
    render(<SignupForm />);
    expect(screen.getByLabelText(/^username$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
  });

  it("renders a create account submit button", () => {
    render(<SignupForm />);
    const buttons = screen.getAllByRole("button", { name: /create account/i });
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("renders a link back to the sign-in page", () => {
    render(<SignupForm />);
    const links = screen.getAllByRole("link", { name: /sign in/i });
    expect(links.length).toBeGreaterThan(0);
    expect(links[0]).toHaveAttribute("href", "/login");
  });

  it("username input has correct constraints", () => {
    render(<SignupForm />);
    const input = screen.getByLabelText(/^username$/i);
    expect(input).toHaveAttribute("required");
    expect(input).toHaveAttribute("minLength", "3");
    expect(input).toHaveAttribute("maxLength", "20");
  });

  it("email input is of type email", () => {
    render(<SignupForm />);
    expect(screen.getByLabelText(/^email$/i)).toHaveAttribute("type", "email");
  });

  it("password input is of type password", () => {
    render(<SignupForm />);
    expect(screen.getByLabelText(/^password$/i)).toHaveAttribute("type", "password");
  });

  it("does not show error banner when there is no error state", () => {
    render(<SignupForm />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows error alert when action state has a message", async () => {
    const { useActionState } = await import("react");
    (useActionState as ReturnType<typeof vi.fn>).mockReturnValueOnce([
      { message: "Username already taken" },
      vi.fn(),
      false,
    ]);
    render(<SignupForm />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/username already taken/i)).toBeInTheDocument();
  });
});
