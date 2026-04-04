// §8.2.3 / §8.2.4 — Live Game View: piece selection, legal-move highlighting, timers

// Tailwind v4 oklch color values used by the Board component.
const COLORS = {
  selectedPiece: "oklch(71.4% 0.203 305.504)", // purple-400  — selected cell
  legalMove: "oklch(79.2% 0.209 151.711)", // green-400   — reachable square
  pendingMove: "oklch(85.2% 0.199 91.936)", // yellow-400  — locked first click
} as const;

// Starting-position cell IDs for the concentric board.
// White pawns occupy r4c1–r4c7; r4c1 is used for most tests.
const WHITE_PAWN = "r4c1";

describe("Live game board", () => {
  beforeEach(() => {
    cy.loginAsTestUser();
    cy.startLocalGame({ timeControl: "Rapid" });
  });

  // ── Piece selection & legal-move highlighting (§8.2.3) ─────────────────────
  describe("Piece selection & legal-move highlighting", () => {
    it("highlights the selected piece cell in purple", () => {
      // Wait for board SVG cells to be rendered.
      cy.get(`svg path#${WHITE_PAWN}`, { timeout: 15_000 }).should("exist");

      cy.get(`svg path#${WHITE_PAWN}`)
        .invoke("attr", "fill")
        .then((originalFill) => {
          cy.get(`svg path#${WHITE_PAWN}`).click();
          cy.get(`svg path#${WHITE_PAWN}`).should(
            "have.attr",
            "fill",
            COLORS.selectedPiece,
          );
          // Original fill should be different (stone/sky board colour).
          expect(originalFill).not.to.equal(COLORS.selectedPiece);
        });
    });

    it("highlights legal destination squares in green", () => {
      cy.get(`svg path#${WHITE_PAWN}`, { timeout: 15_000 }).should("exist");
      cy.get(`svg path#${WHITE_PAWN}`).click();

      // At least one cell should now have the legal-move fill.
      cy.get("svg path")
        .filter((_i, el) => el.getAttribute("fill") === COLORS.legalMove)
        .should("have.length.above", 0);
    });

    it("shows a pending-move colour (yellow) after clicking a legal destination", () => {
      cy.get(`svg path#${WHITE_PAWN}`, { timeout: 15_000 }).should("exist");
      cy.get(`svg path#${WHITE_PAWN}`).click();

      // Find any green (legal) cell and click it.
      cy.get("svg path")
        .filter((_i, el) => el.getAttribute("fill") === COLORS.legalMove)
        .first()
        .then(($legalCell) => {
          const cellId = $legalCell.attr("id")!;
          cy.get(`svg path#${cellId}`).click();
          // The destination becomes yellow (pending confirmation).
          cy.get(`svg path#${cellId}`).should(
            "have.attr",
            "fill",
            COLORS.pendingMove,
          );
        });
    });

    it("deselects a piece when clicking an empty, non-legal cell", () => {
      cy.get(`svg path#${WHITE_PAWN}`, { timeout: 15_000 }).should("exist");
      cy.get(`svg path#${WHITE_PAWN}`).click();
      cy.get(`svg path#${WHITE_PAWN}`).should(
        "have.attr",
        "fill",
        COLORS.selectedPiece,
      );

      // r8c1 is in the middle of the board and starts empty with no pieces.
      cy.get("svg path#r8c1").click();

      // White pawn cell should revert to its board colour (not selected any more).
      cy.get(`svg path#${WHITE_PAWN}`).should(
        "not.have.attr",
        "fill",
        COLORS.selectedPiece,
      );
    });
  });

  // ── Timer display (§8.2.4) ─────────────────────────────────────────────────
  describe("Timer display", () => {
    it("displays clocks in MM:SS format for timed games", () => {
      // The PlayerBar renders timers as font-mono spans — match the pattern.
      cy.get("span.font-mono", { timeout: 10_000 })
        .first()
        .invoke("text")
        .should("match", /^\d+:\d{2}$/);
    });

    it("starts both clocks at the correct rapid time (10:00)", () => {
      // Rapid = 600 000 ms per side, displayed as "10:00".
      cy.get("span.font-mono", { timeout: 10_000 }).each(($el) => {
        // Both player bars start at 10:00 (or very close to it).
        expect($el.text()).to.match(/^(10:00|9:5[89])$/);
      });
    });

    it("active-player clock counts down", () => {
      cy.get("span.font-mono", { timeout: 10_000 }).last().as("clock");

      // Wait for a move — in local mode, make one.
      cy.get(`svg path#${WHITE_PAWN}`, { timeout: 15_000 }).should("exist");

      // Read initial clock value for white.
      cy.get("@clock")
        .invoke("text")
        .then((initial) => {
          // Wait 1.5 s and check the value decreased.
          cy.wait(1500);
          cy.get("@clock")
            .invoke("text")
            .should((later) => {
              // Convert "M:SS" to total seconds for comparison.
              const toSecs = (t: string) => {
                const [m, s] = t.split(":").map(Number);
                return m * 60 + s;
              };
              expect(toSecs(later)).to.be.lessThan(toSecs(initial));
            });
        });
    });
  });
});

// ── Unlimited game — no clock display ─────────────────────────────────────────
describe("Unlimited game has no ticking clocks", () => {
  beforeEach(() => {
    cy.loginAsTestUser();
    cy.startLocalGame({ timeControl: "Unlimited" });
  });

  it("renders ∞ symbols instead of MM:SS clocks", () => {
    cy.get("span.font-mono", { timeout: 10_000 }).each(($el) => {
      expect($el.text()).to.equal("∞");
    });
  });
});
