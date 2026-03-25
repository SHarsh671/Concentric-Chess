"use client";

import { useState } from "react";

export default function RulesPage() {
  const [tab, setTab] = useState<"concentric" | "spiral">("concentric");

  return (
    <div className="min-h-screen bg-white">
      {/* Page header */}
      <div className="border-b-8 border-black bg-black text-white px-8 py-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 text-9xl opacity-5 select-none font-bold leading-none">
          ♟
        </div>
        <div className="max-w-6xl mx-auto">
          <div className="inline-flex items-center gap-2 border-2 border-white px-4 py-1 mb-4 text-xs font-bold uppercase tracking-widest">
            <span>♔</span> Game Rules
          </div>
          <h1 className="text-5xl font-bold uppercase tracking-wide leading-tight">
            Rules
          </h1>
          <p className="mt-2 text-gray-400 text-lg">
            Learn how to play both variants of Circular Chess.
          </p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex border-b-4 border-black justify-center">
        <button
          onClick={() => setTab("concentric")}
          className={`flex items-center gap-3 px-8 py-4 font-bold uppercase tracking-widest text-sm transition-colors border-r-4 border-black ${
            tab === "concentric"
              ? "bg-black text-white"
              : "bg-white text-black hover:bg-gray-100"
          }`}
        >
          <ChessBoardIcon />
          <span>Variant I — Concentric Circle</span>
        </button>
        <button
          onClick={() => setTab("spiral")}
          className={`flex items-center gap-3 px-8 py-4 font-bold uppercase tracking-widest text-sm transition-colors ${
            tab === "spiral"
              ? "bg-black text-white"
              : "bg-white text-black hover:bg-gray-100"
          }`}
        >
          <SpiralIcon active={tab === "spiral"} />
          <span>Variant II — Archimedes Spiral</span>
        </button>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-8 py-10 space-y-10">
        {tab === "concentric" ? <ConcentricRules /> : <SpiralRules />}
      </div>
    </div>
  );
}

/* ─── Concentric Rules ──────────────────────────────────── */
function ConcentricRules() {
  return (
    <>
      <Section title="Board Overview">
        <InfoBox>
          The board has <Strong>72 cells</Strong> arranged in concentric
          circles. Each side has <Strong>16 pieces</Strong> — identical to
          standard chess except for one <Strong>Prince</Strong>.
        </InfoBox>
      </Section>

      <Section title="Notation">
        <InfoBox>
          <p>
            Cells are designated <Strong>a–f</Strong> on the left and{" "}
            <Strong>g–l</Strong> on the right. On the central vertical, light
            cells use a–f and dark cells use g–l.
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Example — clockwise from d7:{" "}
            <code className="bg-gray-100 border border-gray-300 px-2 py-0.5 text-xs">
              d7 d8 d9 i8 i7 i6 i5 i4 d5 d6
            </code>
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Every cell has neighbours across an <Strong>edge</Strong>{" "}
            (orthogonal) or a <Strong>vertex</Strong> (diagonal).
          </p>
        </InfoBox>
      </Section>

      <Section title="Special Cell Types">
        <div className="space-y-3">
          <SpecialCell label="Crescents" marker="◆">
            Cells aligned vertically through the centre. Same-colour crescent
            cells are vertex neighbours.
          </SpecialCell>
          <SpecialCell label="Half Moons" marker="◑">
            The two central crescents with opposite colours. Each has 3 edge
            neighbours and 3 vertex neighbours.
          </SpecialCell>
          <SpecialCell label="Twin Cells" marker="⟺">
            The two horizontal cells one edge away from a crescent or half moon.
          </SpecialCell>
        </div>
      </Section>

      <Section title="Piece Movements">
        <div className="border-4 border-black overflow-hidden">
          {[
            {
              piece: "♔ King",
              rule: "1 cell in any direction. First move may leap 2 cells (even in check, even knight-style). Intermediate cell may be occupied but not threatened.",
            },
            {
              piece: "♙ Prince",
              rule: "Moves like a King but is not subject to check. On first move, may step 2 cells forward if it does not capture or leap.",
            },
            {
              piece: "♖ Rook",
              rule: "1 or more cells horizontally or around a circle. Cannot rotate a full 360° to its starting position. May move between g7 and f6 (and reverse).",
            },
            {
              piece: "♗ Bishop",
              rule: "1 or more cells diagonally, keeping its colour. Landing on a crescent or half-moon from a non-crescent enables a swing on the same move. Each bishop may change colour once.",
            },
            { piece: "♕ Queen", rule: "Combines Rook and Bishop movement." },
            {
              piece: "♞ Knight",
              rule: "Crosses an edge then a non-adjacent vertex, or a vertex then a non-adjacent edge. Near twins or half-moons may move a short distance like a rook.",
            },
            {
              piece: "♟ Pawn",
              rule: "1 cell forward onto a different colour. May move 2 cells on its initial move. On a crescent or half-moon it becomes a Berolina pawn (moves diagonally, captures across an edge).",
            },
          ].map(({ piece, rule }, i) => (
            <div
              key={piece}
              className={`grid ${i !== 0 ? "border-t border-gray-200" : ""}`}
              style={{ gridTemplateColumns: "200px 1fr" }}
            >
              <div className="p-4 font-bold text-sm border-r-4 border-black flex items-center bg-white">
                {piece}
              </div>
              <div
                className={`p-4 text-sm leading-relaxed ${
                  i % 2 === 0 ? "bg-white" : "bg-gray-50"
                }`}
              >
                {rule}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Pawn Movement Details">
        <div className="grid grid-cols-2 gap-4">
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
      </Section>

      <Section title="Special Rules">
        <div className="grid grid-cols-2 gap-3">
          {[
            { rule: "Castling", detail: "Does not occur." },
            { rule: "En Passant", detail: "As in standard chess." },
            {
              rule: "Promotion",
              detail:
                "White promotes on row 10, Black on row 3. May become any piece except itself, the other pawn type, a Prince, or a King.",
            },
            {
              rule: "Prince Promotion",
              detail:
                "Like pawn promotion but may also become any standard piece — not itself, either pawn type, or King.",
            },
          ].map(({ rule, detail }) => (
            <div key={rule} className="border-4 border-black overflow-hidden">
              <div className="bg-black text-white px-4 py-2 font-bold text-sm uppercase tracking-wide">
                {rule}
              </div>
              <div className="px-4 py-3 text-sm leading-relaxed">{detail}</div>
            </div>
          ))}
        </div>
      </Section>

      <Footer>
        ♙ All forward motion considers the opponent&apos;s vertex twins to the
        side as forward. ♟
      </Footer>
    </>
  );
}

/* ─── Spiral Rules ──────────────────────────────────────── */
function SpiralRules() {
  return (
    <>
      <Section title="Overview">
        <InfoBox>
          Archimedes Spiral Chess is played on a board of{" "}
          <Strong>two interlocking Archimedes spirals</Strong>. All rules from
          Concentric Circle Chess apply, with the specific modifications listed
          below. Understanding how diagonals behave on the spiral is key.
        </InfoBox>
      </Section>

      <Section title="Rule Modifications from Concentric Circle Chess">
        <div className="space-y-3">
          <RuleChange number="1" title="Bishop & Queen on Light Crescents">
            A bishop or queen on a <Strong>light crescent</Strong> may move
            along the entire vertical involving both{" "}
            <code className="bg-gray-100 border border-gray-200 px-1 text-xs">
              f7
            </code>{" "}
            and{" "}
            <code className="bg-gray-100 border border-gray-200 px-1 text-xs">
              g6
            </code>{" "}
            — effectively crossing the spiral junction in one move.
          </RuleChange>
          <RuleChange number="2" title="Pawn at l6 / a7">
            A <Strong>white pawn on l6</Strong> may advance one cell to{" "}
            <code className="bg-gray-100 border border-gray-200 px-1 text-xs">
              a7
            </code>
            . Conversely, a <Strong>black pawn on a7</Strong> may advance to{" "}
            <code className="bg-gray-100 border border-gray-200 px-1 text-xs">
              l6
            </code>
            .
          </RuleChange>
        </div>
      </Section>

      <Section title="Rules Inherited from Concentric Circle Chess">
        <InfoBox>
          All other rules apply unchanged — including pawn types (regular vs
          Berolina on crescents), the Prince, castling being absent, en passant,
          and promotion rows (row 10 for White, row 3 for Black). Switch to the
          Concentric Circle tab for full details.
        </InfoBox>
      </Section>

      <Section title="Quick Reference — What's Different?">
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              label: "Board shape",
              value: "Two interlocking Archimedes spirals",
            },
            {
              label: "Diagonals",
              value: "Follow spiral wrapping — use table above",
            },
            {
              label: "Bishop/Queen on f7 or g6",
              value: "Can traverse the full central vertical",
            },
            {
              label: "Pawn wrap",
              value: "White l6→a7 and Black a7→l6 allowed",
            },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="border-l-4 border-black border border-gray-200 p-3"
            >
              <div className="font-bold text-sm mb-1 uppercase tracking-wide">
                {label}
              </div>
              <div className="text-sm text-gray-600">{value}</div>
            </div>
          ))}
        </div>
      </Section>

      <Footer>
        ♙ Spiral topology changes where diagonals lead — always consult the
        reference table. ♟
      </Footer>
    </>
  );
}

/* ─── Shared sub-components ─────────────────────────────── */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="text-base font-bold uppercase tracking-widest border-b-4 border-black pb-2 mb-4">
        {title}
      </h3>
      {children}
    </section>
  );
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 border-l-4 border-black border border-gray-200 px-5 py-4 text-sm leading-relaxed">
      {children}
    </div>
  );
}

function Strong({ children }: { children: React.ReactNode }) {
  return <strong className="font-bold">{children}</strong>;
}

function SpecialCell({
  label,
  marker,
  children,
}: {
  label: string;
  marker: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 items-start border-4 border-black p-4 hover:bg-black hover:text-white transition-colors group">
      <span className="text-xl leading-none min-w-6">{marker}</span>
      <div>
        <div className="font-bold mb-1 uppercase tracking-wide text-sm">
          {label}
        </div>
        <div className="text-sm leading-relaxed text-gray-600 group-hover:text-gray-300">
          {children}
        </div>
      </div>
    </div>
  );
}

function PawnTable({ title, rows }: { title: string; rows: string[][] }) {
  return (
    <div className="border-4 border-black overflow-hidden">
      <div className="bg-black text-white px-3 py-2 font-bold text-xs uppercase tracking-wide">
        {title}
      </div>
      <table className="w-full border-collapse">
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className={
                i === 0
                  ? "bg-gray-100"
                  : i % 2 === 0
                  ? "bg-gray-50"
                  : "bg-white"
              }
            >
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={`px-2 py-2 text-xs border-b border-gray-200 ${
                    j < row.length - 1 ? "border-r border-gray-200" : ""
                  } ${i === 0 ? "font-bold" : ""}`}
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

function RuleChange({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-0 border-4 border-black overflow-hidden">
      <div className="bg-black text-white px-4 py-4 font-bold text-lg flex items-center justify-center min-w-12">
        {number}
      </div>
      <div className="px-4 py-3">
        <div className="font-bold mb-1 uppercase tracking-wide text-sm">
          {title}
        </div>
        <div className="text-sm text-gray-600 leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

function Footer({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-t-4 border-black pt-4 text-center text-xs text-gray-400 italic">
      {children}
    </div>
  );
}

function ChessBoardIcon() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 9px)",
        gap: "1px",
        background: "currentColor",
        padding: "1px",
      }}
    >
      {Array.from({ length: 16 }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 9,
            height: 9,
            background:
              (Math.floor(i / 4) + (i % 4)) % 2 === 0 ? "white" : "black",
          }}
        />
      ))}
    </div>
  );
}

function SpiralIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 36 36" fill="none">
      <path
        d="M18 2 C28 2,34 8,34 18 C34 28,28 34,18 34 C8 34,4 28,4 18 C4 10,9 6,18 6 C26 6,30 12,30 18 C30 24,26 28,18 28 C12 28,10 24,10 18 C10 14,13 12,18 12 C22 12,24 15,24 18"
        stroke={active ? "white" : "black"}
        strokeWidth="2"
        fill="none"
      />
    </svg>
  );
}