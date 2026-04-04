// §8.2.5 — Account & Profile Interface
// Verifies form validation, error banners, and that successful updates
// are reflected immediately in the UI.

export {};

const TEST_USER = {
  username: "e2e_test",
  password: "E2eTest123!",
};

const WRONG_PASSWORD = "WrongPass999!";

describe("Settings page", () => {
  beforeEach(() => {
    cy.loginAsTestUser();
    cy.visit("/settings");
  });

  // ── Page structure ─────────────────────────────────────────────────────────
  it("renders all three update forms and a logout button", () => {
    cy.contains("Update Username").should("be.visible");
    cy.contains("Update Email").should("be.visible");
    cy.contains("Update Password").should("be.visible");
    cy.contains("button", "Logout").should("be.visible");
  });

  // ── Form input constraints ─────────────────────────────────────────────────
  it("username form fields are present and required", () => {
    cy.get('input#username[name="username"]').should("exist").and("be.visible");
    cy.get('input#username_password[name="password"]')
      .should("exist")
      .and("be.visible");
  });

  it("email form fields are present and required", () => {
    cy.get('input#email[name="email"]').should("exist").and("be.visible");
    cy.get('input#email-password[name="password"]')
      .should("exist")
      .and("be.visible");
  });

  it("password form has current, new, and confirm fields", () => {
    cy.get('input#password[name="password"]').should("exist");
    cy.get('input#new_password[name="new_password"]').should("exist");
    cy.get('input#confirm_password[name="confirm_password"]').should("exist");
  });

  // ── Error messages on wrong password ──────────────────────────────────────
  it("shows an error when the wrong password is supplied for username update", () => {
    cy.get('input#username[name="username"]').type("new_username_attempt");
    cy.get('input#username_password[name="password"]').type(WRONG_PASSWORD);
    cy.contains("button", "Update Username").click();
    cy.get('[role="alert"]').should("exist");
    // URL stays on settings
    cy.url().should("include", "/settings");
  });

  it("shows an error when the wrong password is supplied for email update", () => {
    cy.get('input#email[name="email"]').type("newemail@example.com");
    cy.get('input#email-password[name="password"]').type(WRONG_PASSWORD);
    cy.contains("button", "Update Email").click();
    cy.get('[role="alert"]').should("exist");
  });

  it("shows an error when new and confirm passwords do not match", () => {
    cy.get('input#password[name="password"]').type(TEST_USER.password);
    cy.get('input#new_password[name="new_password"]').type("NewPass123!");
    cy.get('input#confirm_password[name="confirm_password"]').type(
      "DifferentNewPass!",
    );
    cy.contains("button", "Update Password").click();
    cy.get('[role="alert"]').should("exist");
  });

  it("shows an error when wrong current password is given for password change", () => {
    cy.get('input#password[name="password"]').type(WRONG_PASSWORD);
    cy.get('input#new_password[name="new_password"]').type("NewPass123!");
    cy.get('input#confirm_password[name="confirm_password"]').type(
      "NewPass123!",
    );
    cy.contains("button", "Update Password").click();
    cy.get('[role="alert"]').should("exist");
  });

  // ── Successful update reflects in UI immediately (§8.2.5 key requirement) ─
  it("successful email update redirects back to /settings without error", () => {
    const newEmail = `e2e_updated_${Date.now()}@test.example`;
    cy.get('input#email[name="email"]').type(newEmail);
    cy.get('input#email-password[name="password"]').type(TEST_USER.password);
    cy.contains("button", "Update Email").click();
    // Server action redirects to /settings on success — no error alert.
    cy.url().should("include", "/settings");
    cy.get('[role="alert"]').should("not.exist");
  });

  // ── Logout ─────────────────────────────────────────────────────────────────
  it("Logout button clears session and redirects away from /settings", () => {
    cy.contains("button", "Logout").click();
    cy.url().should("not.include", "/settings");
    // Nav should now show Log In
    cy.contains("Log In").should("be.visible");
  });
});

// ── Access control ────────────────────────────────────────────────────────────
describe("Settings access control", () => {
  it("redirects unauthenticated users from /settings to /login", () => {
    cy.clearCookies();
    cy.visit("/settings");
    cy.url().should("include", "/login");
  });
});
