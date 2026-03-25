use std::collections::{HashMap, HashSet};

fn id((row, col): (usize, usize)) -> String {
    format!("r{row}c{col}")
}

fn get_num_cols(row: usize) -> usize {
    let row = if row >= 7 { 13 - row } else { row };
    1 + (2 * (row - 1))
}

fn get_edge_neighbors(row: usize, col: usize) -> HashSet<(usize, usize)> {
    // first we check if on center diagonal
    let num_cols = get_num_cols(row);
    let mut neighbors = HashSet::new();
    let is_center = col == num_cols.div_ceil(2);
    if col > 1 && col < num_cols {
        // if NOT on the outer circle, then will have neighbors on either side
        neighbors.insert((row, col - 1));
        neighbors.insert((row, col + 1));
    } else if col == 1 && num_cols > 1 {
        // if on left half, has neighbor on right
        neighbors.insert((row, col + 1));
    } else if num_cols > 1 {
        // if on right half, has neighbor on left
        neighbors.insert((row, col - 1));
    }
    if is_center {
        if num_cols == 11 {
            // if in very center center, then the opposite center is a neighbor
            neighbors.insert((13 - row, col));
        } else if row <= 6 {
            // if on the center diagonal, then the two sides of the next row up/down are neighbors
            neighbors.insert((row + 1, col));
            neighbors.insert((row + 1, col + 2));
        } else if row >= 7 {
            // if on the center diagonal, then the two sides of the next row up/down are neighbors
            neighbors.insert((row - 1, col));
            neighbors.insert((row - 1, col + 2));
        }
    } else {
        // all non-center squares have neighbors up and down
        if col < num_cols.div_ceil(2) {
            // if on the left half, same column number as neighbors
            neighbors.insert((row + 1, col));
            neighbors.insert((row - 1, col));
        } else {
            // if on the right half, then they're the same distince from the end, so we need to
            // adjust the column number
            let from_end = num_cols - col;
            neighbors.insert((row + 1, get_num_cols(row + 1) - from_end));
            neighbors.insert((row - 1, get_num_cols(row - 1) - from_end));
        }
    }
    neighbors
}

fn get_vertex_neighbors(row: usize, col: usize) -> HashSet<(usize, usize)> {
    let num_cols = get_num_cols(row);
    let mut neighbors = HashSet::new();
    let center = num_cols.div_ceil(2);
    let is_center = col == center;
    let is_left = col < num_cols.div_ceil(2);
    let is_bottom = row <= 6;
    let is_twin_cell = col == (center - 1) || col == (center + 1);
    if is_center {
        if row != 6 && row != 12 {
            // if center and not the very center, adjacent to the row up
            neighbors.insert((row + 1, get_num_cols(row + 1).div_ceil(2)));
        }
        if row != 7 && row != 1 {
            // if center and not the very center, adjacent to the row down
            neighbors.insert((row - 1, get_num_cols(row - 1).div_ceil(2)));
        }
        if num_cols == 11 {
            if is_bottom {
                // neighbors up and to the left and right
                neighbors.insert((row + 1, col - 1));
                neighbors.insert((row + 1, col + 1));
            } else {
                // neighbors down and to the left and right
                neighbors.insert((row - 1, col - 1));
                neighbors.insert((row - 1, col + 1));
            }
        } else if num_cols > 1 {
            if is_bottom {
                // neighbors up and to the left and right
                neighbors.insert((row + 1, col - 1));
                neighbors.insert((row + 1, col + 3));
            } else {
                // neighbors down and to the left and right
                neighbors.insert((row - 1, col - 1));
                neighbors.insert((row - 1, col + 3));
            }
        }
    } else if is_twin_cell {
        if col == center - 1 {
            // if left twin cell, then neighbor is right twin cell
            neighbors.insert((row, col + 2));
        } else {
            // if right twin cell, then neighbor is left twin cell
            neighbors.insert((row, col - 2));
        }
        if row == 6 || row == 7 {
            if is_left {
                neighbors.insert((row + 1, col - 1));
                neighbors.insert((row - 1, col - 1));
            } else if is_bottom {
                neighbors.insert((row + 1, col + 1));
                neighbors.insert((row - 1, col - 1));
            } else {
                neighbors.insert((row + 1, col - 1));
                neighbors.insert((row - 1, col + 1));
            }
            if is_bottom {
                // if on bottom, has a neighbor towards the center
                neighbors.insert((row + 1, get_num_cols(row + 1).div_ceil(2)));
            } else {
                // if on top, has a neighbor towards the center
                neighbors.insert((row - 1, get_num_cols(row - 1).div_ceil(2)));
            }
        } else {
            if col > 1 && col < num_cols {
                // also has neighbors towards the end up and down
                if is_left {
                    neighbors.insert((row + 1, col - 1));
                    neighbors.insert((row - 1, col - 1));
                } else if is_bottom {
                    neighbors.insert((row + 1, col + 3));
                    neighbors.insert((row - 1, col - 1));
                } else {
                    neighbors.insert((row + 1, col - 1));
                    neighbors.insert((row - 1, col + 3));
                }
            }
            if is_bottom {
                // if on bottom, has a neighbor towards the center
                neighbors.insert((row + 1, col + 1));
            } else {
                // if on top, has a neighbor towards the center
                neighbors.insert((row - 1, col + 1));
            }
        }
    } else if col == 1 {
        // has neighbors up and down to the right
        neighbors.insert((row + 1, col + 1));
        neighbors.insert((row - 1, col + 1));
    } else if col == num_cols {
        if row == 6 {
            neighbors.insert((row + 1, col - 1));
            neighbors.insert((row - 1, col - 3));
        } else if row == 7 {
            neighbors.insert((row + 1, col - 3));
            neighbors.insert((row - 1, col - 1));
        } else
        // has neighbors up and down to the left
        if is_bottom {
            neighbors.insert((row + 1, col + 1));
            neighbors.insert((row - 1, col - 3));
        } else {
            neighbors.insert((row + 1, col - 3));
            neighbors.insert((row - 1, col + 1));
        }
    } else {
        // otherwise has neighbors in all four directions
        if row == 6 {
            neighbors.insert((row + 1, col - 1));
            neighbors.insert((row + 1, col + 1));
            if is_left {
                neighbors.insert((row - 1, col - 1));
                neighbors.insert((row - 1, col + 1));
            } else {
                neighbors.insert((row - 1, col - 3));
                neighbors.insert((row - 1, col - 1));
            }
        } else if row == 7 {
            neighbors.insert((row - 1, col - 1));
            neighbors.insert((row - 1, col + 1));
            if is_left {
                neighbors.insert((row + 1, col - 1));
                neighbors.insert((row + 1, col + 1));
            } else {
                neighbors.insert((row + 1, col - 3));
                neighbors.insert((row + 1, col - 1));
            }
        } else if is_left {
            neighbors.insert((row + 1, col - 1));
            neighbors.insert((row + 1, col + 1));
            neighbors.insert((row - 1, col - 1));
            neighbors.insert((row - 1, col + 1));
        } else if is_bottom {
            // right and on the bottom, up a row +1 and +3, down is -1 -3
            neighbors.insert((row + 1, col + 1));
            neighbors.insert((row + 1, col + 3));
            neighbors.insert((row - 1, col - 1));
            neighbors.insert((row - 1, col - 3));
        } else {
            neighbors.insert((row + 1, col - 1));
            neighbors.insert((row + 1, col - 3));
            neighbors.insert((row - 1, col + 1));
            neighbors.insert((row - 1, col + 3));
        }
    }
    neighbors
}

// this means that we go from key -> in -> value, essentially key is the opposite vertex of
// value when going through in
fn get_edge_next(row: usize, col: usize) -> HashMap<(usize, usize), (usize, usize)> {
    let num_cols = get_num_cols(row);
    let mut next = HashMap::new();
    let center = num_cols.div_ceil(2);
    let is_center = col == center;
    let is_left = col < num_cols.div_ceil(2);
    let is_bottom = row <= 6;

    // around the circle or across a row, every cell but the ends has across the row
    // the crescents only go around the circle
    if is_center {
        if row == 6 || row == 7 {
            // if in very center, then it can only swing along the row
        } else if is_bottom {
            next.insert((row + 1, col), (row + 1, col + 2));
        } else {
            next.insert((row - 1, col), (row - 1, col + 2));
        }
    } else if is_left {
        // every non-center cell is able to go around the circle
        next.insert((row + 1, col), (row - 1, col));
    } else {
        // every non-center cell is able to go around the circle
        let from_end = num_cols - col;
        next.insert(
            (row + 1, get_num_cols(row + 1) - from_end),
            (row - 1, get_num_cols(row - 1) - from_end),
        );
    }
    if col != 1 && col != num_cols {
        // if not on the end, can also go across the row
        next.insert((row, col - 1), (row, col + 1));
    }

    let mut map = HashMap::new();
    for (key, value) in next {
        map.insert(key, value);
        map.insert(value, key);
    }
    map
}

fn get_vertex_next(row: usize, col: usize) -> HashMap<(usize, usize), (usize, usize)> {
    let num_cols = get_num_cols(row);
    let mut next = HashMap::new();
    let center = num_cols.div_ceil(2);
    let is_center = col == center;
    let is_left = col < num_cols.div_ceil(2);
    let is_bottom = row <= 6;
    let is_twin_cell = col == (center - 1) || col == (center + 1);

    // twin cells can go through
    // crescents allow passing through (when not on the outermost edge)
    // cells on the outermost circle do not have any vertex nexts
    // inner cells allow passing through from all four corners
    if row != 1 && row != 12 && col != 1 && col != num_cols {
        // exclude the outermost circle
        if is_center {
            if row == 6 {
                next.insert((7, 5), (7, 7));
            } else if row == 7 {
                next.insert((6, 5), (6, 7));
            } else if is_bottom {
                next.insert((row + 1, col - 1), (row + 1, col + 3));
                next.insert((row + 1, col + 1), (row - 1, col - 1));
            } else {
                next.insert((row - 1, col - 1), (row - 1, col + 3));
                next.insert((row + 1, col - 1), (row - 1, col + 1));
            }
        } else if is_twin_cell {
            // twim cells allow passing through all four corners, with the corner facing their twin
            // allowing for passing through to the other twin
            if is_bottom {
                if is_left {
                    next.insert((row + 1, col - 1), (row, col + 2));
                    next.insert((row + 1, col + 1), (row - 1, col - 1));
                } else if row == 6 {
                    // (6, 7)
                    next.insert((7, 6), (5, 6));
                    next.insert((7, 8), (6, 5));
                } else {
                    next.insert((row + 1, col + 3), (row, col - 2));
                    next.insert((row + 1, col + 1), (row - 1, col - 1));
                }
            } else if is_left {
                next.insert((row + 1, col - 1), (row - 1, col + 1));
                next.insert((row - 1, col - 1), (row, col + 2));
            } else if row == 7 {
                // (7, 7)
                next.insert((6, 6), (8, 6));
                next.insert((7, 5), (6, 8));
            } else {
                next.insert((row, col - 2), (row - 1, col + 3));
                next.insert((row + 1, col - 1), (row - 1, col + 1));
            }
            // not a twin cell, not an outer circle cell, not a crescent or a half moon, should
            // just have it's four corners as nexts
        } else if is_bottom {
            if is_left {
                next.insert((row + 1, col - 1), (row - 1, col + 1));
                next.insert((row + 1, col + 1), (row - 1, col - 1));
            } else if row == 6 {
                next.insert((row + 1, col - 1), (row - 1, col - 1));
                next.insert((row + 1, col + 1), (row - 1, col - 3));
            } else {
                next.insert((row + 1, col + 1), (row - 1, col - 1));
                next.insert((row + 1, col + 3), (row - 1, col - 3));
            }
        } else if is_left {
            next.insert((row + 1, col - 1), (row - 1, col + 1));
            next.insert((row + 1, col + 1), (row - 1, col - 1));
        } else if row == 7 {
            next.insert((row + 1, col - 3), (row - 1, col + 1));
            next.insert((row + 1, col - 1), (row - 1, col - 1));
        } else {
            next.insert((row + 1, col - 3), (row - 1, col + 3));
            next.insert((row + 1, col - 1), (row - 1, col + 1));
        }
    }

    let mut map = HashMap::new();
    for (key, value) in next {
        map.insert(key, value);
        map.insert(value, key);
    }
    map
}

#[allow(clippy::collapsible_if, clippy::collapsible_else_if)]
fn get_color(row: usize, col: usize, is_archimedean: bool) -> &'static str {
    if is_archimedean {
        // four colors, light1, dark1, light2, dark2 based on the two spirals
        let out = if row > 6 {
            if row % 2 == 1 {
                // odd rows start from dark
                if col % 2 == 1 { "dark" } else { "light" }
            } else {
                // even rows start from light
                if col % 2 == 1 { "light" } else { "dark" }
            }
        } else if row % 2 == 1 {
            // odd archimedean bottom rows start from light
            if col % 2 == 1 { "light" } else { "dark" }
        } else {
            // even rows start from light
            if col % 2 == 1 { "dark" } else { "light" }
        };
        if row > 6 {
            if col % 2 == 1 {
                if out == "light" { "light1" } else { "dark1" }
            } else {
                if out == "light" { "light2" } else { "dark2" }
            }
        } else {
            if col % 2 == 1 {
                if out == "light" { "light2" } else { "dark2" }
            } else {
                if out == "light" { "light1" } else { "dark1" }
            }
        }
    } else if row % 2 == 1 {
        // odd rows start from dark
        if col % 2 == 1 { "dark" } else { "light" }
    } else {
        // even rows start from light
        if col % 2 == 1 { "light" } else { "dark" }
    }
}

fn main() {
    let is_archimedean = std::env::args().any(|arg| arg == "--archimedean");
    let mut edge_neighbors = HashMap::new();
    let mut vertex_neighbors = HashMap::new();
    let mut edge_next = HashMap::new();
    let mut vertex_next = HashMap::new();
    let mut color_map = HashMap::new();
    for r in 1..=12 {
        for c in 1..=get_num_cols(r) {
            edge_neighbors.insert((r, c), get_edge_neighbors(r, c));
            vertex_neighbors.insert((r, c), get_vertex_neighbors(r, c));
            edge_next.insert((r, c), get_edge_next(r, c));
            vertex_next.insert((r, c), get_vertex_next(r, c));
            color_map.insert((r, c), get_color(r, c, is_archimedean));
        }
    }

    if is_archimedean {
        // archimedean graph we want to remove everything about rows 6 and 7 and do those manually
        for c in 1..=11 {
            edge_neighbors.remove(&(6, c));
            edge_neighbors.remove(&(7, c));
            vertex_neighbors.remove(&(6, c));
            vertex_neighbors.remove(&(7, c));
            edge_next.remove(&(6, c));
            edge_next.remove(&(7, c));
            vertex_next.remove(&(6, c));
            vertex_next.remove(&(7, c));
        }
        // (6, 1)
        edge_neighbors.insert((6, 1), HashSet::from([(5, 1), (6, 2), (7, 2)]));
        vertex_neighbors.insert((6, 1), HashSet::from([(5, 2), (7, 1), (7, 3)]));
        edge_next.insert((6, 1), HashMap::from([((5, 1), (7, 2)), ((7, 2), (5, 1))]));
        vertex_next.insert((6, 1), HashMap::from([((5, 2), (7, 1)), ((7, 1), (5, 2))]));
        // (6, 2)
        edge_neighbors.insert((6, 2), HashSet::from([(5, 2), (6, 1), (6, 3), (7, 3)]));
        vertex_neighbors.insert((6, 2), HashSet::from([(5, 1), (5, 3), (7, 2), (7, 4)]));
        edge_next.insert(
            (6, 2),
            HashMap::from([
                ((5, 2), (7, 3)),
                ((7, 3), (5, 2)),
                ((6, 1), (6, 3)),
                ((6, 3), (6, 1)),
            ]),
        );
        vertex_next.insert(
            (6, 2),
            HashMap::from([
                ((5, 1), (7, 4)),
                ((7, 4), (5, 1)),
                ((5, 3), (7, 2)),
                ((7, 2), (5, 3)),
            ]),
        );
        // (6, 3)
        edge_neighbors.insert((6, 3), HashSet::from([(5, 3), (6, 2), (6, 4), (7, 4)]));
        vertex_neighbors.insert((6, 3), HashSet::from([(5, 2), (5, 4), (7, 3), (7, 5)]));
        edge_next.insert(
            (6, 3),
            HashMap::from([
                ((5, 3), (7, 4)),
                ((7, 4), (5, 3)),
                ((6, 2), (6, 4)),
                ((6, 4), (6, 2)),
            ]),
        );
        vertex_next.insert(
            (6, 3),
            HashMap::from([
                ((5, 2), (7, 5)),
                ((7, 5), (5, 2)),
                ((5, 4), (7, 3)),
                ((7, 3), (5, 4)),
            ]),
        );
        // (6, 4)
        edge_neighbors.insert((6, 4), HashSet::from([(5, 4), (6, 3), (6, 5), (7, 5)]));
        vertex_neighbors.insert((6, 4), HashSet::from([(5, 3), (5, 5), (7, 4), (7, 6)]));
        edge_next.insert(
            (6, 4),
            HashMap::from([
                ((5, 4), (7, 5)),
                ((7, 5), (5, 4)),
                ((6, 3), (6, 5)),
                ((6, 5), (6, 3)),
            ]),
        );
        vertex_next.insert(
            (6, 4),
            HashMap::from([
                ((5, 3), (7, 6)),
                ((7, 6), (5, 3)),
                ((5, 5), (7, 4)),
                ((7, 4), (5, 5)),
            ]),
        );
        // (6, 5)
        edge_neighbors.insert((6, 5), HashSet::from([(5, 5), (6, 4), (6, 6), (7, 6)]));
        vertex_neighbors.insert((6, 5), HashSet::from([(5, 4), (6, 7), (7, 5)]));
        edge_next.insert(
            (6, 5),
            HashMap::from([
                ((5, 5), (7, 6)),
                ((7, 6), (5, 5)),
                ((6, 4), (6, 6)),
                ((6, 6), (6, 4)),
            ]),
        );
        vertex_next.insert((6, 5), HashMap::from([((6, 7), (7, 5)), ((7, 5), (6, 7))]));
        // (6, 6)
        edge_neighbors.insert((6, 6), HashSet::from([(6, 5), (6, 7), (7, 7)]));
        vertex_neighbors.insert((6, 6), HashSet::from([(5, 5), (7, 6), (7, 8)]));
        edge_next.insert((6, 6), HashMap::from([((6, 5), (6, 7)), ((6, 7), (6, 5))]));
        vertex_next.insert((6, 6), HashMap::from([((5, 5), (7, 6)), ((7, 6), (5, 5))]));
        // (6, 7)
        edge_neighbors.insert((6, 7), HashSet::from([(5, 5), (6, 6), (6, 8), (7, 8)]));
        vertex_neighbors.insert((6, 7), HashSet::from([(6, 5), (5, 6), (7, 7), (7, 9)]));
        edge_next.insert(
            (6, 7),
            HashMap::from([
                ((5, 5), (7, 8)),
                ((7, 8), (5, 5)),
                ((6, 6), (6, 8)),
                ((6, 8), (6, 6)),
            ]),
        );
        vertex_next.insert(
            (6, 7),
            HashMap::from([
                ((6, 5), (7, 9)),
                ((7, 9), (6, 5)),
                ((5, 6), (7, 7)),
                ((7, 7), (5, 6)),
            ]),
        );
        // (6, 8)
        edge_neighbors.insert((6, 8), HashSet::from([(5, 6), (6, 7), (6, 9), (7, 9)]));
        vertex_neighbors.insert((6, 8), HashSet::from([(5, 5), (5, 7), (7, 8), (7, 10)]));
        edge_next.insert(
            (6, 8),
            HashMap::from([
                ((5, 6), (7, 9)),
                ((7, 9), (5, 6)),
                ((6, 7), (6, 9)),
                ((6, 9), (6, 7)),
            ]),
        );
        vertex_next.insert(
            (6, 8),
            HashMap::from([
                ((5, 5), (7, 10)),
                ((7, 10), (5, 5)),
                ((5, 7), (7, 8)),
                ((7, 8), (5, 7)),
            ]),
        );
        // (6, 9)
        edge_neighbors.insert((6, 9), HashSet::from([(5, 7), (6, 8), (6, 10), (7, 10)]));
        vertex_neighbors.insert((6, 9), HashSet::from([(5, 6), (5, 8), (7, 9), (7, 11)]));
        edge_next.insert(
            (6, 9),
            HashMap::from([
                ((5, 7), (7, 10)),
                ((7, 10), (5, 7)),
                ((6, 8), (6, 10)),
                ((6, 10), (6, 8)),
            ]),
        );
        vertex_next.insert(
            (6, 9),
            HashMap::from([
                ((5, 6), (7, 11)),
                ((7, 11), (5, 6)),
                ((5, 8), (7, 9)),
                ((7, 9), (5, 8)),
            ]),
        );
        // (6, 10)
        edge_neighbors.insert((6, 10), HashSet::from([(5, 8), (6, 9), (6, 11), (7, 11)]));
        vertex_neighbors.insert((6, 10), HashSet::from([(5, 7), (5, 9), (7, 10)]));
        edge_next.insert(
            (6, 10),
            HashMap::from([
                ((5, 8), (7, 11)),
                ((7, 11), (5, 8)),
                ((6, 9), (6, 11)),
                ((6, 11), (6, 9)),
            ]),
        );
        vertex_next.insert(
            (6, 10),
            HashMap::from([((5, 9), (7, 10)), ((7, 10), (5, 9))]),
        );
        // (6, 11)
        edge_neighbors.insert((6, 11), HashSet::from([(5, 9), (6, 10)]));
        vertex_neighbors.insert((6, 11), HashSet::from([(5, 8), (7, 11)]));
        edge_next.insert((6, 11), HashMap::new());
        vertex_next.insert((6, 11), HashMap::new());

        // (7, 1)
        edge_neighbors.insert((7, 1), HashSet::from([(7, 2), (8, 1)]));
        vertex_neighbors.insert((7, 1), HashSet::from([(6, 1), (8, 2)]));
        edge_next.insert((7, 1), HashMap::new());
        vertex_next.insert((7, 1), HashMap::new());
        // (7, 2)
        edge_neighbors.insert((7, 2), HashSet::from([(6, 1), (7, 1), (7, 3), (8, 2)]));
        vertex_neighbors.insert((7, 2), HashSet::from([(6, 2), (8, 1), (8, 3)]));
        edge_next.insert(
            (7, 2),
            HashMap::from([
                ((6, 1), (8, 2)),
                ((8, 2), (6, 1)),
                ((7, 1), (7, 3)),
                ((7, 3), (7, 1)),
            ]),
        );
        vertex_next.insert((7, 2), HashMap::from([((6, 2), (8, 1)), ((8, 1), (6, 2))]));
        // (7, 3)
        edge_neighbors.insert((7, 3), HashSet::from([(6, 2), (7, 2), (7, 4), (8, 3)]));
        vertex_neighbors.insert((7, 3), HashSet::from([(6, 1), (6, 3), (8, 2), (8, 4)]));
        edge_next.insert(
            (7, 3),
            HashMap::from([
                ((6, 2), (8, 3)),
                ((8, 3), (6, 2)),
                ((7, 2), (7, 4)),
                ((7, 4), (7, 2)),
            ]),
        );
        vertex_next.insert(
            (7, 3),
            HashMap::from([
                ((6, 1), (8, 4)),
                ((8, 4), (6, 1)),
                ((6, 3), (8, 2)),
                ((8, 2), (6, 3)),
            ]),
        );
        // (7, 4)
        edge_neighbors.insert((7, 4), HashSet::from([(6, 3), (7, 3), (7, 5), (8, 4)]));
        vertex_neighbors.insert((7, 4), HashSet::from([(6, 2), (6, 4), (8, 3), (8, 5)]));
        edge_next.insert(
            (7, 4),
            HashMap::from([
                ((6, 3), (8, 4)),
                ((8, 4), (6, 3)),
                ((7, 3), (7, 5)),
                ((7, 5), (7, 3)),
            ]),
        );
        vertex_next.insert(
            (7, 4),
            HashMap::from([
                ((6, 2), (8, 5)),
                ((8, 5), (6, 2)),
                ((6, 4), (8, 3)),
                ((8, 3), (6, 4)),
            ]),
        );
        // (7, 5)
        edge_neighbors.insert((7, 5), HashSet::from([(6, 4), (7, 4), (7, 6), (8, 5)]));
        vertex_neighbors.insert((7, 5), HashSet::from([(6, 3), (6, 5), (8, 4), (7, 7)]));
        edge_next.insert(
            (7, 5),
            HashMap::from([
                ((6, 4), (8, 5)),
                ((8, 5), (6, 4)),
                ((7, 4), (7, 6)),
                ((7, 6), (7, 4)),
            ]),
        );
        vertex_next.insert(
            (7, 5),
            HashMap::from([
                ((6, 3), (7, 7)),
                ((7, 7), (6, 3)),
                ((6, 5), (8, 4)),
                ((8, 4), (6, 5)),
            ]),
        );
        // (7, 6)
        edge_neighbors.insert((7, 6), HashSet::from([(6, 5), (7, 5), (7, 7)]));
        vertex_neighbors.insert((7, 6), HashSet::from([(6, 4), (6, 6), (8, 5)]));
        edge_next.insert((7, 6), HashMap::from([((7, 5), (7, 7)), ((7, 7), (7, 5))]));
        vertex_next.insert((7, 6), HashMap::from([((6, 6), (8, 5)), ((8, 5), (6, 6))]));
        // (7, 7)
        edge_neighbors.insert((7, 7), HashSet::from([(6, 6), (7, 6), (7, 8), (8, 5)]));
        vertex_neighbors.insert((7, 7), HashSet::from([(7, 5), (6, 7), (8, 6)]));
        edge_next.insert(
            (7, 7),
            HashMap::from([
                ((6, 6), (8, 5)),
                ((8, 5), (6, 6)),
                ((7, 6), (7, 8)),
                ((7, 8), (7, 6)),
            ]),
        );
        vertex_next.insert((7, 7), HashMap::from([((7, 5), (6, 7)), ((6, 7), (7, 5))]));
        // (7, 8)
        edge_neighbors.insert((7, 8), HashSet::from([(6, 7), (7, 7), (7, 9), (8, 6)]));
        vertex_neighbors.insert((7, 8), HashSet::from([(6, 6), (6, 8), (8, 5), (8, 7)]));
        edge_next.insert(
            (7, 8),
            HashMap::from([
                ((6, 7), (8, 6)),
                ((8, 6), (6, 7)),
                ((7, 7), (7, 9)),
                ((7, 9), (7, 7)),
            ]),
        );
        vertex_next.insert(
            (7, 8),
            HashMap::from([
                ((6, 6), (8, 7)),
                ((8, 7), (6, 6)),
                ((6, 8), (8, 5)),
                ((8, 5), (6, 8)),
            ]),
        );
        // (7, 9)
        edge_neighbors.insert((7, 9), HashSet::from([(6, 8), (7, 8), (7, 10), (8, 7)]));
        vertex_neighbors.insert((7, 9), HashSet::from([(6, 7), (6, 9), (8, 6), (8, 8)]));
        edge_next.insert(
            (7, 9),
            HashMap::from([
                ((6, 8), (8, 7)),
                ((8, 7), (6, 8)),
                ((7, 8), (7, 10)),
                ((7, 10), (7, 8)),
            ]),
        );
        vertex_next.insert(
            (7, 9),
            HashMap::from([
                ((6, 7), (8, 8)),
                ((8, 8), (6, 7)),
                ((6, 9), (8, 6)),
                ((8, 6), (6, 9)),
            ]),
        );
        // (7, 10)
        edge_neighbors.insert((7, 10), HashSet::from([(6, 9), (7, 9), (7, 11), (8, 8)]));
        vertex_neighbors.insert((7, 10), HashSet::from([(6, 8), (6, 10), (8, 7), (8, 9)]));
        edge_next.insert(
            (7, 10),
            HashMap::from([
                ((6, 9), (8, 8)),
                ((8, 8), (6, 9)),
                ((7, 9), (7, 11)),
                ((7, 11), (7, 9)),
            ]),
        );
        vertex_next.insert(
            (7, 10),
            HashMap::from([
                ((6, 8), (8, 9)),
                ((8, 9), (6, 8)),
                ((6, 10), (8, 7)),
                ((8, 7), (6, 10)),
            ]),
        );
        // (7, 11)
        edge_neighbors.insert((7, 11), HashSet::from([(6, 10), (7, 10), (8, 9)]));
        vertex_neighbors.insert((7, 11), HashSet::from([(6, 9), (6, 11), (8, 8)]));
        edge_next.insert(
            (7, 11),
            HashMap::from([((6, 10), (8, 9)), ((8, 9), (6, 10))]),
        );
        vertex_next.insert(
            (7, 11),
            HashMap::from([((6, 11), (8, 8)), ((8, 8), (6, 11))]),
        );
    }

    let export = serde_json::json! {{
        "edgeNbrs": edge_neighbors
        .into_iter()
        .map(|(k, v)| (id(k), v.iter().map(|n| id(*n)).collect::<Vec<_>>()))
        .collect::<HashMap<_, _>>(),
        "vertexNbrs": vertex_neighbors
        .into_iter()
        .map(|(k, v)| (id(k), v.iter().map(|n| id(*n)).collect::<Vec<_>>()))
        .collect::<HashMap<_, _>>(),
        "edgeNext": edge_next.into_iter().map(|(k, v)| (id(k), v.into_iter().map(|(k, v)| (id(k), id(v))).collect::<HashMap<_, _>>())).collect::<HashMap<_, _>>(),
        "vertexNext": vertex_next.into_iter().map(|(k, v)| (id(k), v.into_iter().map(|(k, v)| (id(k), id(v))).collect::<HashMap<_, _>>())).collect::<HashMap<_, _>>(),
        "color": color_map.into_iter().map(|(k, v)| (id(k), v)).collect::<HashMap<_, _>>()
    }};
    if is_archimedean {
        std::fs::write(
            "src/archimedean_graph.json",
            serde_json::to_string_pretty(&export).unwrap(),
        )
        .unwrap();
    } else {
        std::fs::write(
            "src/concentric_graph.json",
            serde_json::to_string_pretty(&export).unwrap(),
        )
        .unwrap();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_num_cols() {
        assert_eq!(get_num_cols(1), 1);
        assert_eq!(get_num_cols(2), 3);
        assert_eq!(get_num_cols(3), 5);
        assert_eq!(get_num_cols(4), 7);
        assert_eq!(get_num_cols(5), 9);
        assert_eq!(get_num_cols(6), 11);
        assert_eq!(get_num_cols(7), 11);
        assert_eq!(get_num_cols(8), 9);
        assert_eq!(get_num_cols(9), 7);
        assert_eq!(get_num_cols(10), 5);
        assert_eq!(get_num_cols(11), 3);
        assert_eq!(get_num_cols(12), 1);
    }

    #[test]
    fn test_get_edge_neighbors() {
        assert_eq!(get_edge_neighbors(1, 1), HashSet::from([(2, 1), (2, 3)]));
        assert_eq!(
            get_edge_neighbors(2, 1),
            HashSet::from([(1, 1), (3, 1), (2, 2)])
        );
        assert_eq!(
            get_edge_neighbors(2, 2),
            HashSet::from([(2, 1), (2, 3), (3, 2), (3, 4)])
        );
        assert_eq!(
            get_edge_neighbors(2, 3),
            HashSet::from([(1, 1), (2, 2), (3, 5)])
        );
        assert_eq!(
            get_edge_neighbors(6, 6),
            HashSet::from([(6, 5), (6, 7), (7, 6)])
        );
        assert_eq!(
            get_edge_neighbors(7, 6),
            HashSet::from([(7, 5), (7, 7), (6, 6)])
        );
        assert_eq!(
            get_edge_neighbors(11, 1),
            HashSet::from([(10, 1), (12, 1), (11, 2)])
        );
        assert_eq!(
            get_edge_neighbors(11, 2),
            HashSet::from([(11, 1), (11, 3), (10, 2), (10, 4)])
        );
        assert_eq!(
            get_edge_neighbors(11, 3),
            HashSet::from([(10, 5), (12, 1), (11, 2)])
        );
        assert_eq!(get_edge_neighbors(12, 1), HashSet::from([(11, 1), (11, 3)]));
    }

    #[test]
    fn test_id() {
        assert_eq!(id((1, 1)), "r1c1");
        assert_eq!(id((2, 3)), "r2c3");
        assert_eq!(id((10, 5)), "r10c5");
    }

    #[test]
    fn test_get_vertex_neighbors() {
        assert_eq!(get_vertex_neighbors(1, 1), HashSet::from([(2, 2)]));
        assert_eq!(get_vertex_neighbors(2, 1), HashSet::from([(3, 2), (2, 3)]));
        assert_eq!(
            get_vertex_neighbors(2, 2),
            HashSet::from([(3, 1), (3, 5), (1, 1), (3, 3)])
        );
        assert_eq!(get_vertex_neighbors(2, 3), HashSet::from([(2, 1), (3, 4)]));
    }

    #[test]
    fn test_get_edge_next() {
        assert_eq!(
            get_edge_next(6, 6),
            HashMap::from([((6, 5), (6, 7)), ((6, 7), (6, 5)),])
        );
        assert_eq!(
            get_edge_next(7, 6),
            HashMap::from([((7, 5), (7, 7)), ((7, 7), (7, 5)),])
        );
        assert_eq!(
            get_edge_next(11, 2),
            HashMap::from([
                ((11, 1), (11, 3)),
                ((11, 3), (11, 1)),
                ((10, 4), (10, 2)),
                ((10, 2), (10, 4))
            ])
        );
        assert_eq!(
            get_edge_next(5, 1),
            HashMap::from([((6, 1), (4, 1)), ((4, 1), (6, 1)),])
        );
        assert_eq!(
            get_edge_next(1, 1),
            HashMap::from([((2, 1), (2, 3)), ((2, 3), (2, 1)),])
        );
        assert_eq!(
            get_edge_next(9, 5),
            HashMap::from([
                ((9, 4), (9, 6)),
                ((9, 6), (9, 4)),
                ((10, 3), (8, 7)),
                ((8, 7), (10, 3))
            ])
        );
    }

    #[test]
    fn test_get_vertex_next() {
        assert_eq!(
            get_vertex_next(6, 6),
            HashMap::from([((7, 5), (7, 7)), ((7, 7), (7, 5))])
        );
        assert_eq!(
            get_vertex_next(7, 6),
            HashMap::from([((6, 5), (6, 7)), ((6, 7), (6, 5)),])
        );
        assert_eq!(
            get_vertex_next(11, 2),
            HashMap::from([
                ((12, 1), (10, 3)),
                ((10, 3), (12, 1)),
                ((10, 1), (10, 5)),
                ((10, 5), (10, 1))
            ])
        );
        assert_eq!(
            get_vertex_next(5, 2),
            HashMap::from([
                ((6, 1), (4, 3)),
                ((4, 3), (6, 1)),
                ((6, 3), (4, 1)),
                ((4, 1), (6, 3))
            ])
        );
    }
}
