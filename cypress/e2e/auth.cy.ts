// §8.2.1 / §8.2.5 — Auth flow: sign-up form validation, login errors, full cycle
describe("Authentication flow", () => {
  // ── Sign-up form client-side validation ───────────────────────────────────
  describe("Sign-up form validation", () => {
    beforeEach(() => cy.visit("/signup"));

    it("requires all fields before submission", () => {
      // HTML5 required validation prevents submission with empty fields.
      cy.get('[type="submit"]').click();
      cy.url().should("include", "/signup");
    });

    it("rejects a password shorter than 8 characters via HTML5 minLength", () => {
      cy.get("#email").type("test@example.com");
      cy.get("#username").type("validuser");
      cy.get("#password").type("short"); // 5 chars — below minLength=8
      cy.get("#confirm-password").type("short");
      cy.get('[type="submit"]').click();
      cy.url().should("include", "/signup");
    });

    it("shows an error when passwords do not match", () => {
      cy.get("#email").type("mismatch@example.com");
      cy.get("#username").type("mismatchuser");
      cy.get("#password").type("Password123!");
      cy.get("#confirm-password").type("Different456!");
      cy.get('[type="submit"]').click();
      // Server returns an error — form stays on /signup with message visible.
      cy.url().should("include", "/signup");
      cy.contains("do not match").should("be.visible");
    });

    it("shows an error for a duplicate username", () => {
      // Use the well-known E2E test account (created by loginAsTestUser).
      cy.loginAsTestUser();
      cy.visit("/signup");
      cy.get("#email").type("other@example.com");
      cy.get("#username").type("e2e_test"); // already exists
      cy.get("#password").type("Password123!");
      cy.get("#confirm-password").type("Password123!");
      cy.get('[type="submit"]').click();
      cy.url().should("include", "/signup");
      cy.get('[role="alert"]').should("be.visible");
    });
  });

  // ── Login form ─────────────────────────────────────────────────────────────
  describe("Login form", () => {
    beforeEach(() => cy.visit("/login"));

    it("shows an error for invalid credentials", () => {
      cy.get("#username").type("nonexistentuser");
      cy.get("#password").type("wrongpassword1");
      cy.get('[type="submit"]').click();
      cy.get('[role="alert"]').should("be.visible");
      cy.url().should("include", "/login");
    });

    it("redirects to home after successful login", () => {
      cy.loginAsTestUser();
      cy.url().should("not.include", "/login");
    });
  });

  // ── Logout ─────────────────────────────────────────────────────────────────
  describe("Logout", () => {
    it("clears session and redirects to home", () => {
      cy.loginAsTestUser();
      cy.visit("/settings");
      cy.contains("button", "Logout").click();
      // After logout the session is cleared — nav shows Sign Up / Log In.
      cy.url().should("not.include", "/settings");
      cy.contains("Log In").should("be.visible");
    });
  });

  // ── Unauthenticated redirect ───────────────────────────────────────────────
  it("redirects /settings to login when unauthenticated", () => {
    cy.clearCookies();
    cy.visit("/settings");
    cy.url().should("include", "/login");
  });
});
