
// <svg
//   viewBox="0 0 1730 1730"
//   className="absolute top-[-1px] left-[0px] w-[900px] h-[900px]"
// >
//   <circle cx="865" cy="865" r="600" fill="none" stroke="#000" strokeWidth="5" />
//   <circle cx="865" cy="865" r="500" fill="none" stroke="#000" strokeWidth="5" />
//   <circle cx="865" cy="865" r="400" fill="none" stroke="#000" strokeWidth="5" />
//   <circle cx="865" cy="865" r="300" fill="none" stroke="#000" strokeWidth="5" />
//   <circle cx="865" cy="865" r="200" fill="none" stroke="#000" strokeWidth="5" />
//   <circle cx="865" cy="865" r="100" fill="none" stroke="#000" strokeWidth="5" />
//   <line x1="265" y1="365" x2="1465" y2="365" stroke="#000" strokeWidth="5" />
//   <line x1="265" y1="465" x2="1465" y2="465" stroke="#000" strokeWidth="5" />
//   <line x1="265" y1="565" x2="1465" y2="565" stroke="#000" strokeWidth="5" />
//   <line x1="265" y1="665" x2="1465" y2="665" stroke="#000" strokeWidth="5" />
//   <line x1="265" y1="765" x2="1465" y2="765" stroke="#000" strokeWidth="5" />
//   <line x1="265" y1="865" x2="1465" y2="865" stroke="#000" strokeWidth="5" />
//   <line x1="265" y1="965" x2="1465" y2="965" stroke="#000" strokeWidth="5" />
//   <line x1="265" y1="1065" x2="1465" y2="1065" stroke="#000" strokeWidth="5" />
//   <line x1="265" y1="1165" x2="1465" y2="1165" stroke="#000" strokeWidth="5" />
//   <line x1="265" y1="1265" x2="1465" y2="1265" stroke="#000" strokeWidth="5" />
//   <line x1="265" y1="1365" x2="1465" y2="1365" stroke="#000" strokeWidth="5" />
// </svg>

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

import { intersect, shape } from "svg-intersections";

function getNumCols(row) {
    row = row >= 7 ? 13 - row : row;
    return 1 + (2 * (row - 1));
}

const lineIntersections = [];

for (let i = 0; i < 12; i++) {
    const intersections = circles.flatMap((circle) => {
        return intersect(shape("circle", circle), shape("line", lines[i])).points.map((point) => point.x);
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
        // now we need to compute the bounding box and path for this cell
        // crescents only have two points (with an arc between them)
        // all other cells have four points (with two arcs between them)
        if (c == center) {
        }
    }
}
