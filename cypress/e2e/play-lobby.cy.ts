// §8.2.2 — Game Lobby & Matchmaking View
describe("Play lobby UI", () => {
  context("Unauthenticated visitor", () => {
    beforeEach(() => {
      cy.clearCookies();
      cy.visit("/play");
    });

    it("shows a 'Login Required' banner", () => {
      cy.contains("Login Required").should("be.visible");
    });

    it("disables the Start Game button", () => {
      cy.contains("button", "Login to Start").should("be.disabled");
    });
  });

  context("Game configuration selectors", () => {
    beforeEach(() => cy.visit("/play"));

    it("can switch between Concentric and Archimedean game types", () => {
      cy.contains("button", "Concentric").click();
      cy.contains("button", "Concentric").should("have.class", "bg-black");

      cy.contains("button", "Archimedean").click();
      cy.contains("button", "Archimedean").should("have.class", "bg-black");
    });

    it("can select time controls: Rapid, Blitz, Bullet, Unlimited", () => {
      const controls = ["Rapid", "Blitz", "Bullet", "Unlimited"];
      controls.forEach((tc) => {
        cy.contains("button", tc).click();
        cy.contains("button", tc).should("have.class", "bg-black");
      });
    });

    it("can switch between Online and Local modes", () => {
      cy.contains("button", "Online").click();
      cy.contains("button", "Online").should("have.class", "bg-black");

      cy.contains("button", "Local").click();
      cy.contains("button", "Local").should("have.class", "bg-black");
    });

    it("shows opponent username input only in Online mode", () => {
      cy.contains("button", "Online").click();
      cy.get('input[name="username"]').should("be.visible");

      cy.contains("button", "Local").click();
      cy.get('input[name="username"]').should("not.exist");
    });
  });

  context("Error handling", () => {
    beforeEach(() => {
      cy.loginAsTestUser();
      cy.visit("/play");
    });

    it("shows an error banner when an unknown username is entered", () => {
      cy.contains("button", "Online").click();
      cy.get('input[name="username"]').type("DefinitelyDoesNotExist99");
      cy.contains("button", "Start Game").click();
      cy.contains("not found").should("exist");
    });
  });
});
