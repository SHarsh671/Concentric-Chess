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
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-yellow-50 rounded-lg shadow-2xl max-w-4xl max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-blue-900 text-white p-6 flex justify-between items-center rounded-t-lg">
          <h2 className="text-3xl font-bold">Concentric Circle Chess Rules</h2>
          <button
            onClick={onClose}
            className="hover:bg-white/20 p-2 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-8 text-gray-800">
          {/* Board Overview */}
          <section>
            <h3 className="text-2xl font-bold text-indigo-700 mb-4 border-b-2 border-indigo-200 pb-2">
              Board Overview
            </h3>
            <div className="bg-yellow-100 p-4 rounded-lg">
              <p className="text-lg leading-relaxed">
                The board has <span className="font-bold text-indigo-600">72 cells</span> arranged in concentric circles. 
                Each side has <span className="font-bold text-indigo-600">16 pieces</span>.
              </p>
            </div>
          </section>

          {/* Notation */}
          <section>
            <h3 className="text-2xl font-bold text-indigo-700 mb-4 border-b-2 border-indigo-200 pb-2">
              Notation
            </h3>
            <div className="bg-yellow-100 p-4 rounded-lg space-y-3">
              <p>
                Cells are designated by letters <span className="font-mono font-bold">a–f</span> and{" "}
                <span className="font-mono font-bold">g–l</span>.
              </p>
              <div className="bg-yellow-50 p-3 border-l-4 border-indigo-400">
                <p className="font-mono text-sm">
                  <span className="text-indigo-600 font-bold">
                    d7 d8 d9 i8 i7 i6 i5 i4 d5 d6
                  </span>
                </p>
              </div>
            </div>
          </section>

          {/* Cell Types */}
          <section>
            <h3 className="text-2xl font-bold text-indigo-700 mb-4 border-b-2 border-indigo-200 pb-2">
              Special Cell Types
            </h3>
            <div className="space-y-3">
              <div className="bg-yellow-100 p-4 rounded-lg border-l-4 border-amber-400">
                <h4 className="font-bold text-lg mb-2">Crescents</h4>
                <p>Cells aligned vertically through the center.</p>
              </div>
              <div className="bg-yellow-100 p-4 rounded-lg border-l-4 border-blue-400">
                <h4 className="font-bold text-lg mb-2">Half Moons</h4>
                <p>The two central crescents with opposite colors.</p>
              </div>
              <div className="bg-yellow-100 p-4 rounded-lg border-l-4 border-green-400">
                <h4 className="font-bold text-lg mb-2">Twin Cells</h4>
                <p>The two horizontal cells near crescents.</p>
              </div>
            </div>
          </section>

          {/* Piece Movements */}
          <section>
            <h3 className="text-2xl font-bold text-indigo-700 mb-4 border-b-2 border-indigo-200 pb-2">
              Piece Movements
            </h3>

            <div className="space-y-4">
              {[
                ["King", "1 cell in any direction. First move may leap 2 cells."],
                ["Prince", "Moves like king, not subject to check."],
                ["Rook", "Moves horizontally or around circles."],
                ["Bishop", "Moves diagonally, special swinging rules."],
                ["Queen", "Combines rook and bishop movement."],
                ["Knight", "Edge + vertex movement pattern."],
                ["Pawn", "Moves forward, Berolina rules on crescents."],
              ].map(([title, text]) => (
                <div
                  key={title}
                  className="bg-yellow-100 border-2 border-indigo-200 p-4 rounded-lg"
                >
                  <h4 className="font-bold text-xl mb-2">{title}</h4>
                  <p>{text}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Pawn Details */}
          <section>
            <h3 className="text-2xl font-bold text-indigo-700 mb-4 border-b-2 border-indigo-200 pb-2">
              Pawn Movement Details
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-yellow-100 p-4 rounded-lg">
                <h4 className="font-bold mb-2">Regular Pawn</h4>
                <div className="bg-yellow-50 p-2 rounded">Move edge, capture diagonal</div>
              </div>
              <div className="bg-yellow-100 p-4 rounded-lg">
                <h4 className="font-bold mb-2">Berolina Pawn</h4>
                <div className="bg-yellow-50 p-2 rounded">Move diagonal, capture edge</div>
              </div>
            </div>
          </section>

          {/* Special Rules */}
          <section>
            <h3 className="text-2xl font-bold text-indigo-700 mb-4 border-b-2 border-indigo-200 pb-2">
              Special Rules
            </h3>
            <div className="space-y-3">
              <div className="bg-yellow-100 p-4 rounded-lg border-l-4 border-yellow-400">
                <h4 className="font-bold">Castling</h4>
                <p>Does not occur.</p>
              </div>
              <div className="bg-yellow-100 p-4 rounded-lg border-l-4 border-green-400">
                <h4 className="font-bold">En Passant</h4>
                <p>As in standard chess.</p>
              </div>
            </div>
          </section>

          {/* Footer */}
          <div className="bg-yellow-100 p-6 rounded-lg border-2 border-indigo-300">
            <p className="text-center text-sm italic">
              All forward motion considers opponent&apos;s vertex twins as forward.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
