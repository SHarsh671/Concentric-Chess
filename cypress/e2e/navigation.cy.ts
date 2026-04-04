// §8.2.1 — Navigation & Session Flow
// Verifies that nav links update based on authentication state.
describe("Navigation auth state", () => {
  context("Unauthenticated visitor", () => {
    beforeEach(() => {
      cy.clearCookies();
      cy.visit("/");
    });

    it("shows Sign Up and Log In links", () => {
      cy.contains("Sign Up").should("be.visible");
      cy.contains("Log In").should("be.visible");
    });

    it("does not show Settings link", () => {
      cy.contains("Settings").should("not.exist");
    });

    it("Sign Up link navigates to /signup", () => {
      cy.contains("Sign Up").click();
      cy.url().should("include", "/signup");
    });

    it("Log In link navigates to /login", () => {
      cy.contains("Log In").click();
      cy.url().should("include", "/login");
    });
  });

  context("Authenticated user", () => {
    beforeEach(() => {
      cy.loginAsTestUser();
      cy.visit("/play");
    });

    it("shows Settings link", () => {
      cy.contains("Settings").should("be.visible");
    });

    it("does not show Sign Up or Log In links", () => {
      cy.contains("Sign Up").should("not.exist");
      cy.contains("Log In").should("not.exist");
    });

    it("Settings link navigates to /settings", () => {
      cy.contains("Settings").click();
      cy.url().should("include", "/settings");
    });

    it("nav updates to unauthenticated state after logout", () => {
      cy.visit("/settings");
      cy.contains("button", "Logout").click();
      cy.contains("Log In").should("be.visible");
      cy.contains("Sign Up").should("be.visible");
      cy.contains("Settings").should("not.exist");
    });
  });
});
