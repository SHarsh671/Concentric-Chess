"use client";

import { X } from "lucide-react";

export default function SpiralRulesDialog({
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
            {/* Spiral icon made from nested arcs */}
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <path d="M18 2 C28 2, 34 8, 34 18 C34 28, 28 34, 18 34 C8 34, 4 28, 4 18 C4 10, 9 6, 18 6 C26 6, 30 12, 30 18 C30 24, 26 28, 18 28 C12 28, 10 24, 10 18 C10 14, 13 12, 18 12 C22 12, 24 15, 24 18" stroke="#aaa" strokeWidth="1.5" fill="none"/>
              <path d="M18 15 C20 15, 22 16.5, 22 18 C22 20, 20 22, 18 22 C16 22, 14 20, 14 18 C14 16, 16 14, 18 14" stroke="#fff" strokeWidth="1.5" fill="none"/>
            </svg>
            <div>
              <div style={{ fontSize: "0.65rem", letterSpacing: "0.2em", color: "#aaa", textTransform: "uppercase" }}>
                Variant II
              </div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", letterSpacing: "0.02em" }}>
                Archimedes Spiral Chess
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

          {/* Intro */}
          <Section title="Overview">
            <InfoBox>
              Archimedes Spiral Chess is played on a board of <Strong>two interlocking Archimedes spirals</Strong>.
              All rules from Concentric Circle Chess apply, with the specific modifications listed below.
              Understanding how diagonals behave on the spiral is key.
            </InfoBox>
          </Section>

          {/* Diagonal Reference */}
          <Section title="Diagonal Behaviour on the Spiral">
            <p style={{ fontSize: "0.9rem", color: "#555", marginBottom: "12px" }}>
              Because the spiral wraps, diagonal moves lead to different rows than you might expect.
              Use this reference table — it shows where a diagonal step from a given row leads, depending on direction.
            </p>
            <div style={{ border: "2px solid #111", borderRadius: "4px", overflow: "hidden" }}>
              <div style={{ background: "#111", color: "#fff", padding: "8px 14px", fontWeight: "bold", fontSize: "0.88rem" }}>
                Diagonal Row Reference — Blue Cells
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#e8e8e8" }}>
                    {["From row", "Left diagonal", "Right diagonal (inner)", "Right diagonal (outer)"].map((h) => (
                      <th key={h} style={{ padding: "8px 12px", fontSize: "0.82rem", fontWeight: "bold", borderBottom: "2px solid #111", borderRight: "1px solid #ccc", textAlign: "left" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["11", "11", "11", "11"],
                    ["10", "10", "10", "10"],
                    ["9", "9", "9", "9"],
                    ["8", "8", "8", "8"],
                    ["7", "6", "7", "7"],
                    ["6", "4", "6", "7"],
                    ["5", "3", "5", "7"],
                    ["4", "2", "4", "6"],
                    ["3", "1", "3", "5"],
                    ["2", "—", "2", "4"],
                    ["1", "—", "1", "3"],
                  ].map(([from, l, rm, ro], i) => (
                    <tr key={from} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                      <td style={{ padding: "7px 12px", fontSize: "0.85rem", fontWeight: "bold", borderRight: "1px solid #ddd", borderBottom: "1px solid #eee" }}>{from}</td>
                      <td style={{ padding: "7px 12px", fontSize: "0.85rem", borderRight: "1px solid #ddd", borderBottom: "1px solid #eee", color: l === "—" ? "#bbb" : "#111" }}>{l}</td>
                      <td style={{ padding: "7px 12px", fontSize: "0.85rem", borderRight: "1px solid #ddd", borderBottom: "1px solid #eee" }}>{rm}</td>
                      <td style={{ padding: "7px 12px", fontSize: "0.85rem", borderBottom: "1px solid #eee" }}>{ro}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ fontSize: "0.8rem", color: "#888", marginTop: "8px", fontStyle: "italic" }}>
              Green cells follow the same pattern reflected. A "—" means no diagonal exists in that direction from that row.
            </div>
          </Section>

          {/* Rule Changes */}
          <Section title="Rule Modifications from Concentric Circle Chess">
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <RuleChange number="1" title="Bishop & Queen on Light Crescents">
                A bishop or queen on a <Strong>light crescent</Strong> may move along the entire vertical
                involving both <code>f7</code> and <code>g6</code> — effectively crossing the spiral junction in one move.
              </RuleChange>
              <RuleChange number="2" title="Pawn at l6 / a7">
                A <Strong>white pawn on l6</Strong> may advance one cell to <code>a7</code>.
                Conversely, a <Strong>black pawn on a7</Strong> may advance to <code>l6</code>.
                This crossing reflects the spiral topology of the board.
              </RuleChange>
            </div>
          </Section>

          {/* Inherited Rules Summary */}
          <Section title="Rules Inherited from Concentric Circle Chess">
            <InfoBox>
              All other rules apply unchanged — including pawn types (regular vs Berolina on crescents),
              the Prince, castling being absent, en passant, and promotion rows (row 10 for White, row 3 for Black).
              See the Concentric Circle Chess rules for full details.
            </InfoBox>
          </Section>

          {/* Quick reference */}
          <Section title="Quick Reference — What's Different?">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {[
                { label: "Board shape", value: "Two interlocking Archimedes spirals" },
                { label: "Diagonals", "value": "Follow spiral wrapping — use table above" },
                { label: "Bishop/Queen on f7 or g6", value: "Can traverse the full central vertical" },
                { label: "Pawn wrap", value: "White l6→a7 and Black a7→l6 allowed" },
              ].map(({ label, value }) => (
                <div key={label} style={{ border: "1px solid #ddd", borderLeft: "4px solid #111", borderRadius: "0 4px 4px 0", padding: "10px 14px" }}>
                  <div style={{ fontWeight: "bold", fontSize: "0.85rem", marginBottom: "4px" }}>{label}</div>
                  <div style={{ fontSize: "0.88rem", color: "#444" }}>{value}</div>
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
            ♙ Spiral topology changes where diagonals lead — always consult the reference table. ♟
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

function RuleChange({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", border: "2px solid #111", borderRadius: "4px", overflow: "hidden" }}>
      <div style={{ background: "#111", color: "#fff", padding: "14px 16px", fontWeight: "bold", fontSize: "1.1rem", minWidth: "44px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {number}
      </div>
      <div style={{ padding: "12px 14px 12px 0" }}>
        <div style={{ fontWeight: "bold", marginBottom: "4px" }}>{title}</div>
        <div style={{ fontSize: "0.9rem", color: "#444", lineHeight: "1.5" }}>{children}</div>
      </div>
    </div>
  );
}