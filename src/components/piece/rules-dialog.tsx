"use client";

import { X } from "lucide-react";

export default function RulesDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      style={{ backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="rounded-lg shadow-2xl max-w-4xl max-h-[90vh] overflow-y-auto relative"
        style={{
          background: "#fff",
          border: "3px solid #111",
          boxShadow: "8px 8px 0px #111",
          fontFamily: "'Georgia', serif",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="sticky top-0 flex justify-between items-center p-6 rounded-t-lg"
          style={{
            background: "#111",
            color: "#fff",
            borderBottom: "3px solid #111",
          }}
        >
          <div className="flex items-center gap-3">
            {/* Chess board icon */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 10px)",
                gap: "1px",
                background: "#555",
                padding: "2px",
                border: "1px solid #888",
              }}
            >
              {Array.from({ length: 16 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: 10,
                    height: 10,
                    background:
                      (Math.floor(i / 4) + (i % 4)) % 2 === 0 ? "#fff" : "#111",
                  }}
                />
              ))}
            </div>
            <div>
              <div style={{ fontSize: "0.65rem", letterSpacing: "0.2em", color: "#aaa", textTransform: "uppercase" }}>
                Variant I
              </div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", letterSpacing: "0.02em" }}>
                Concentric Circle Chess
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "2px solid #555",
              borderRadius: "4px",
              padding: "6px",
              cursor: "pointer",
              color: "#fff",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "#fff";
              (e.currentTarget as HTMLButtonElement).style.color = "#111";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              (e.currentTarget as HTMLButtonElement).style.color = "#fff";
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-8" style={{ background: "#fff", color: "#111" }}>

          {/* Board Overview */}
          <Section title="Board Overview">
            <InfoBox>
              The board has <Strong>72 cells</Strong> arranged in concentric circles.
              Each side has <Strong>16 pieces</Strong> — identical to standard chess except
              for one <Strong>Prince</Strong>.
            </InfoBox>
          </Section>

          {/* Notation */}
          <Section title="Notation">
            <InfoBox>
              <p>Cells are designated <Strong>a–f</Strong> on the left and <Strong>g–l</Strong> on the right. On the central vertical, light cells use a–f and dark cells use g–l.</p>
              <p className="mt-2" style={{ fontSize: "0.85rem", color: "#555" }}>
                Example — clockwise from d7:{" "}
                <span style={{ fontFamily: "monospace", background: "#f0f0f0", padding: "2px 6px", borderRadius: "3px", border: "1px solid #ccc" }}>
                  d7 d8 d9 i8 i7 i6 i5 i4 d5 d6
                </span>
              </p>
              <p className="mt-2" style={{ fontSize: "0.85rem", color: "#555" }}>
                Every cell has neighbours across an <Strong>edge</Strong> (orthogonal) or a <Strong>vertex</Strong> (diagonal).
              </p>
            </InfoBox>
          </Section>

          {/* Special Cell Types */}
          <Section title="Special Cell Types">
            <div className="space-y-3">
              <SpecialCell label="Crescents" marker="◆">
                Cells aligned vertically through the centre. Same-colour crescent cells are vertex neighbours.
              </SpecialCell>
              <SpecialCell label="Half Moons" marker="◑">
                The two central crescents with opposite colours. Each has 3 edge neighbours and 3 vertex neighbours.
              </SpecialCell>
              <SpecialCell label="Twin Cells" marker="⟺">
                The two horizontal cells one edge away from a crescent or half moon.
              </SpecialCell>
            </div>
          </Section>

          {/* Piece Movements */}
          <Section title="Piece Movements">
            <div
              style={{
                display: "grid",
                border: "2px solid #111",
                borderRadius: "4px",
                overflow: "hidden",
              }}
            >
              {[
                { piece: "♔ King", rule: "1 cell in any direction. First move may leap 2 cells (even in check, even knight-style). Intermediate cell may be occupied but not threatened." },
                { piece: "♙ Prince", rule: "Moves like a King but is not subject to check. On first move, may step 2 cells forward if it does not capture or leap." },
                { piece: "♖ Rook", rule: "1 or more cells horizontally or around a circle. Cannot rotate a full 360° to its starting position. May move between g7 and f6 (and reverse)." },
                { piece: "♗ Bishop", rule: "1 or more cells diagonally, keeping its colour. Landing on a crescent or half-moon from a non-crescent enables a swing on the same move. Can also swing via twin cells. Each bishop may change colour once by moving/capturing to a neighbouring cell of the other colour." },
                { piece: "♕ Queen", rule: "Combines Rook and Bishop movement." },
                { piece: "♞ Knight", rule: "Crosses an edge then a non-adjacent vertex, or a vertex then a non-adjacent edge. Near twins or half-moons may move a short distance like a rook." },
                { piece: "♟ Pawn", rule: "1 cell forward onto a different colour. May move 2 cells on its initial move. On a crescent or half-moon it becomes a Berolina pawn (moves diagonally, captures across an edge)." },
              ].map(({ piece, rule }, i) => (
                <div
                  key={piece}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "140px 1fr",
                    borderTop: i === 0 ? "none" : "1px solid #ddd",
                    background: i % 2 === 0 ? "#fff" : "#f8f8f8",
                  }}
                >
                  <div
                    style={{
                      padding: "12px 16px",
                      fontWeight: "bold",
                      fontSize: "1rem",
                      borderRight: "2px solid #111",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    {piece}
                  </div>
                  <div style={{ padding: "12px 16px", fontSize: "0.9rem", lineHeight: "1.5" }}>
                    {rule}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Pawn Details */}
          <Section title="Pawn Movement Details">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <PawnTable
                title="Regular Pawn"
                rows={[
                  ["Location", "Move", "Capture"],
                  ["Outer circle", "Edge (1)", "Diagonal (1)"],
                  ["Other cells", "Edge (1)", "Diagonal (2)"],
                ]}
              />
              <PawnTable
                title="Berolina Pawn (on crescent / half-moon)"
                rows={[
                  ["Location", "Move", "Capture"],
                  ["Home crescents", "Diagonal (3)", "Edge (2)"],
                  ["Home half-moon", "Diagonal (2)", "Edge (1)"],
                  ["Opp. half-moon", "Diagonal (1)", "Edge (2) side"],
                  ["Opp. crescents", "Diagonal (1)", "Edge (2) side"],
                ]}
              />
            </div>
            <InfoBox>
              <span style={{ fontSize: "0.85rem", color: "#555" }}>
                * All forward motion considers the opponent&apos;s vertex twins to the side as forward.
              </span>
            </InfoBox>
          </Section>

          {/* Special Rules */}
          <Section title="Special Rules">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {[
                { rule: "Castling", detail: "Does not occur." },
                { rule: "En Passant", detail: "As in standard chess." },
                { rule: "Promotion", detail: "White promotes on row 10, Black on row 3. May become any piece except itself, the other pawn type, a Prince, or a King. Must be exercised at first opportunity if at all." },
                { rule: "Prince Promotion", detail: "Like pawn promotion but may also become any standard piece — not itself, either pawn type, or King." },
              ].map(({ rule, detail }) => (
                <div
                  key={rule}
                  style={{
                    border: "2px solid #111",
                    borderRadius: "4px",
                    overflow: "hidden",
                  }}
                >
                  <div style={{ background: "#111", color: "#fff", padding: "8px 14px", fontWeight: "bold", fontSize: "0.9rem" }}>
                    {rule}
                  </div>
                  <div style={{ padding: "10px 14px", fontSize: "0.88rem", lineHeight: "1.5" }}>
                    {detail}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Footer */}
          <div
            style={{
              borderTop: "2px solid #111",
              paddingTop: "16px",
              textAlign: "center",
              fontSize: "0.8rem",
              color: "#777",
              fontStyle: "italic",
            }}
          >
            ♙ All forward motion considers the opponent&apos;s vertex twins to the side as forward. ♟
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3
        style={{
          fontSize: "1.1rem",
          fontWeight: "bold",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          borderBottom: "3px solid #111",
          paddingBottom: "6px",
          marginBottom: "14px",
        }}
      >
        {title}
      </h3>
      {children}
    </section>
  );
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "#f8f8f8",
        border: "1px solid #ddd",
        borderLeft: "4px solid #111",
        borderRadius: "0 4px 4px 0",
        padding: "14px 18px",
        lineHeight: "1.7",
        fontSize: "0.92rem",
      }}
    >
      {children}
    </div>
  );
}

function Strong({ children }: { children: React.ReactNode }) {
  return <strong style={{ fontWeight: "bold" }}>{children}</strong>;
}

function SpecialCell({ label, marker, children }: { label: string; marker: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        gap: "12px",
        alignItems: "flex-start",
        border: "1px solid #ddd",
        borderRadius: "4px",
        padding: "12px 16px",
        background: "#fafafa",
      }}
    >
      <span style={{ fontSize: "1.3rem", lineHeight: 1, minWidth: "24px" }}>{marker}</span>
      <div>
        <div style={{ fontWeight: "bold", marginBottom: "4px" }}>{label}</div>
        <div style={{ fontSize: "0.9rem", color: "#444", lineHeight: "1.5" }}>{children}</div>
      </div>
    </div>
  );
}

function PawnTable({ title, rows }: { title: string; rows: string[][] }) {
  return (
    <div style={{ border: "2px solid #111", borderRadius: "4px", overflow: "hidden" }}>
      <div style={{ background: "#111", color: "#fff", padding: "8px 14px", fontWeight: "bold", fontSize: "0.88rem" }}>
        {title}
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ background: i === 0 ? "#e8e8e8" : i % 2 === 0 ? "#fafafa" : "#fff" }}>
              {row.map((cell, j) => (
                <td
                  key={j}
                  style={{
                    padding: "7px 10px",
                    fontSize: "0.8rem",
                    fontWeight: i === 0 ? "bold" : "normal",
                    borderBottom: "1px solid #ddd",
                    borderRight: j < row.length - 1 ? "1px solid #ddd" : "none",
                  }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}