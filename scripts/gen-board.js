const circles = [
  { cx: 865, cy: 865, r: 600 },
  { cx: 865, cy: 865, r: 500 },
  { cx: 865, cy: 865, r: 400 },
  { cx: 865, cy: 865, r: 300 },
  { cx: 865, cy: 865, r: 200 },
  { cx: 865, cy: 865, r: 100 },
];

const lines = [
  { x1: 265, y1: 365, x2: 1465, y2: 365 },
  { x1: 265, y1: 465, x2: 1465, y2: 465 },
  { x1: 265, y1: 565, x2: 1465, y2: 565 },
  { x1: 265, y1: 665, x2: 1465, y2: 665 },
  { x1: 265, y1: 765, x2: 1465, y2: 765 },
  { x1: 265, y1: 865, x2: 1465, y2: 865 },
  { x1: 265, y1: 965, x2: 1465, y2: 965 },
  { x1: 265, y1: 1065, x2: 1465, y2: 1065 },
  { x1: 265, y1: 1165, x2: 1465, y2: 1165 },
  { x1: 265, y1: 1265, x2: 1465, y2: 1265 },
  { x1: 265, y1: 1365, x2: 1465, y2: 1365 },
];

const { intersect, shape } = require("svg-intersections");
const fs = require("fs");

function getNumCols(row) {
  row = row >= 7 ? 13 - row : row;
  return 1 + 2 * (row - 1);
}

const lineIntersections = [];

for (let i = 0; i < 11; i++) {
  const intersections = circles.flatMap((circle) => {
    return intersect(
      shape("circle", circle),
      shape("line", lines[i]),
    ).points.map((point) => point.x);
  });
  intersections.sort((a, b) => a - b);
  lineIntersections.push(intersections);
}
// element 0 is now the line that has row 1 BENEATH IT
lineIntersections.reverse();

const tiles = [];

for (let r = 1; r <= 12; r++) {
  const numCols = getNumCols(r);
  const center = Math.ceil(getNumCols(r) / 2);
  for (let c = 1; c <= numCols; c++) {
    const isBottom = r <= 6;
    const isLeft = c < center;
    // now we need to compute the bounding box and path for this cell
    // crescents only have two points (with an arc between them)
    // all other cells have four points (with two arcs between them)
    if (c == center) {
      if (isBottom) {
        const line = lineIntersections[r - 1];
        const left = line[c - 1];
        // if we have an odd number of points, then the middle one we want to ignore since it's 865 and is the crescent intersecting again
        const right = line[c + (line.length % 2)];
        const radius = (7 - r) * 100;
        const y = 865 + radius;
        const d = `M ${left} ${y} A ${radius} ${radius} 0 0 0 ${right} ${y} Z`;
        tiles.push({ id: `r${r}c${c}`, d });
      } else {
        const line = lineIntersections[r - 2];
        const left = line[c - 1];
        // if we have an odd number of points, then the middle one we want to ignore since it's 865 and is the crescent intersecting again
        const right = line[c + (line.length % 2)];
        const radius = (r - 6) * 100;
        const y = 1065 - radius;
        const d = `M ${left} ${y} A ${radius} ${radius} 0 0 1 ${right} ${y} Z`;
        tiles.push({ id: `r${r}c${c}`, d });
      }
    } else {
      // otherwise, we need to find the four points that define the cell and then create the appropriate arcs
      const fromEnd = isLeft ? c - 1 : numCols - c;
      const topLine = lineIntersections[r - 1];
      const bottomLine = lineIntersections[r - 2];
      const topLeft = isLeft
        ? topLine[c - 1]
        : topLine[topLine.length - fromEnd - 2];
      const topRight = isLeft
        ? topLine[c]
        : topLine[topLine.length - fromEnd - 1];
      const bottomLeft = isLeft
        ? bottomLine[c - 1]
        : bottomLine[bottomLine.length - fromEnd - 2];
      const bottomRight = isLeft
        ? bottomLine[c]
        : bottomLine[bottomLine.length - fromEnd - 1];
      const [leftArcRadius, rightArcRadius] = isLeft
        ? [600 - (c - 1) * 100, 600 - c * 100]
        : [600 - (numCols - c + 1) * 100, 600 - (numCols - c) * 100];
      const leftArcSweep = isLeft ? 0 : 1;
      const rightArcSweep = isLeft ? 1 : 0;
      const topY = 1565 - r * 100;
      const bottomY = 1665 - r * 100;
      const d = `M ${topLeft} ${topY} A ${leftArcRadius} ${leftArcRadius} 0 0 ${leftArcSweep} ${bottomLeft} ${bottomY} L ${bottomRight} ${bottomY} A ${rightArcRadius} ${rightArcRadius} 0 0 ${rightArcSweep} ${topRight} ${topY} Z`;
      tiles.push({ id: `r${r}c${c}`, d });
    }
  }
}
const svg = `<svg viewBox="0 0 1730 1730" style="position: absolute; top: -1px; left: 0px; width: 900px; height: 900px;">${tiles
  .map(
    (tile) =>
      `<path id="${tile.id}" d="${tile.d}" fill="none" stroke="#000" stroke-width="5"/>`,
  )
  .join("")}</svg>`;
fs.writeFileSync("concentric_board.svg", svg);
const html = `<html><body><div style="position: relative; width: 900px; height: 900px;">${svg}</div></body></html>`;
fs.writeFileSync("concentric_board.html", html);
