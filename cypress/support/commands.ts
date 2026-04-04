// ---------------------------------------------------------------------------
// Custom Cypress commands
// ---------------------------------------------------------------------------

// Make this file a module so the global augmentation below is valid.
export {};

declare global {
  namespace Cypress {
    interface Chainable {
      loginAsTestUser(): Chainable;
      startLocalGame(opts?: { timeControl?: string }): Chainable;
    }
  }
}

const TEST_USER = {
  username: "e2e_test",
  email: "e2e@test.example",
  password: "E2eTest123!",
};

/**
 * Ensure the E2E test user exists and is logged in.
 * Uses cy.session() to restore the cookie across tests.
 */
Cypress.Commands.add("loginAsTestUser", () => {
  cy.session(
    TEST_USER.username,
    () => {
      // 1. Try to sign up — succeeds on first run, fails (returns to /signup) on subsequent runs.
      cy.visit("/signup");
      cy.get("#email").type(TEST_USER.email);
      cy.get("#username").type(TEST_USER.username);
      cy.get("#password").type(TEST_USER.password);
      cy.get("#confirm-password").type(TEST_USER.password);
      cy.get('[type="submit"]').click();

      // 2. After signup the app redirects to "/"; if the user already exists the
      //    form stays on "/signup".  In the latter case fall through to login.
      cy.url().then((url) => {
        if (url.includes("/signup")) {
          cy.visit("/login");
          cy.get("#username").type(TEST_USER.username);
          cy.get("#password").type(TEST_USER.password);
          cy.get('[type="submit"]').click();
        }
        cy.url().should("not.include", "/login");
        cy.url().should("not.include", "/signup");
      });
    },
    {
      cacheAcrossSpecs: true,
      validate() {
        // Verify the session cookie is still valid by checking the nav.
        cy.visit("/");
        cy.contains("Settings").should("exist");
      },
    },
  );
});

/**
 * Navigate to /play, select Local mode + given time control, submit, and alias
 * the resulting game URL as `@gameUrl`.
 */
Cypress.Commands.add("startLocalGame", (opts: { timeControl?: string } = {}) => {
  const timeControl = opts.timeControl ?? "Unlimited";
  cy.visit("/play");
  // Select Local mode
  cy.contains("button", "Local").click();
  // Select the requested time control
  cy.contains("button", timeControl).click();
  // Submit
  cy.contains("button", "Start Game").click();
  // Wait for redirect to /games/...
  cy.url().should("include", "/games/");
  cy.url().as("gameUrl");
});
