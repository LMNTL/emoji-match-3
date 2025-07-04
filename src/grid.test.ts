import { describe, it, expect, beforeEach } from "vitest";
import Grid from "../src/grid";
import { WILDCARD_INDEX, ROCKET_INDICES } from "../src/emojiMap";

describe("Grid", () => {
  let grid: Grid;

  beforeEach(() => {
    // Create a 4x4 grid with predictable values
    grid = new Grid(4, 4, (x, y) => x + y);
  });

  describe("constructor", () => {
    it("should create a grid with correct dimensions", () => {
      expect(grid.getWidth()).toBe(4);
      expect(grid.getLength()).toBe(4);
    });

    it("should initialize grid with setter function", () => {
      expect(grid.get(0, 0)).toBe(0);
      expect(grid.get(1, 1)).toBe(2);
      expect(grid.get(3, 3)).toBe(6);
    });
  });

  describe("get and set", () => {
    it("should get and set values correctly", () => {
      grid.set(2, 2, 99);
      expect(grid.get(2, 2)).toBe(99);
    });

    it("should handle null values", () => {
      grid.set(1, 1, null);
      expect(grid.get(1, 1)).toBe(null);
    });
  });

  describe("toString", () => {
    it("should render the grid as a string", () => {
      const string = grid.toString();
      expect(string).toEqual(
        "[ 0 1 2 3 ]\n" + "[ 1 2 3 4 ]\n" + "[ 2 3 4 5 ]\n" + "[ 3 4 5 6 ]\n",
      );
    });
    it("should render null values as X", () => {
      grid.set(2, 3, null);
      const string = grid.toString();
      expect(string).toEqual(
        "[ 0 1 2 3 ]\n" + "[ 1 2 3 4 ]\n" + "[ 2 3 4 5 ]\n" + "[ 3 4 X 6 ]\n",
      );
    });
  });

  describe("subset", () => {
    it("should return correct subset", () => {
      const subset = grid.subset(1, 1, 3, 3);
      expect(subset).toEqual([
        [2, 3],
        [3, 4],
      ]);
    });

    it("should throw error for out of range subset", () => {
      expect(() => grid.subset(-1, 0, 2, 2)).toThrow("Subset out of range!");
      expect(() => grid.subset(0, 0, 5, 2)).toThrow("Subset out of range!");
    });

    it("should return empty grid for backwards subset", () => {
      const subset = grid.subset(3, 3, 1, 1);
      expect(subset).toEqual([]);
    });
  });

  describe("hasNulls", () => {
    it("should return false when no nulls present", () => {
      expect(grid.hasNulls()).toBe(false);
    });

    it("should return true when nulls are present", () => {
      grid.set(1, 1, null);
      expect(grid.hasNulls()).toBe(true);
    });
  });

  describe("nullCoords", () => {
    it("should set specified coordinates to null", () => {
      grid.nullCoords(["1,1", "2,2"]);
      expect(grid.get(1, 1)).toBe(null);
      expect(grid.get(2, 2)).toBe(null);
    });

    it("should error when setting coordinates out of bounds", () => {
      expect(() => grid.nullCoords(["-2,1", "-2,2"])).toThrow(
        "Cannot set properties of undefined (setting '1')",
      );
    });
  });

  describe("getRow", () => {
    it("should return correct row data", () => {
      const row = grid.getRow(1);
      expect(row).toEqual([
        { x: 1, y: 0, val: 1 },
        { x: 1, y: 1, val: 2 },
        { x: 1, y: 2, val: 3 },
        { x: 1, y: 3, val: 4 },
      ]);
    });

    it("should return undefined for non-existent row", () => {
      const row = grid.getRow(99);
      expect(row).toEqual(undefined);
    });
  });

  describe("getCol", () => {
    it("should return correct column data", () => {
      const col = grid.getCol(1);
      expect(col).toEqual([
        { x: 0, y: 1, val: 1 },
        { x: 1, y: 1, val: 2 },
        { x: 2, y: 1, val: 3 },
        { x: 3, y: 1, val: 4 },
      ]);
    });

    it("should return undefined for non-existent column", () => {
      const col = grid.getCol(99);
      expect(col).toEqual(undefined);
    });
  });

  describe("getDiagonal", () => {
    it("should return correct diagonal (normal)", () => {
      const diagonal = grid.getDiagonal(0, 0);
      expect(diagonal).toEqual([
        { x: 0, y: 0, val: 0 },
        { x: 1, y: 1, val: 2 },
        { x: 2, y: 2, val: 4 },
        { x: 3, y: 3, val: 6 },
      ]);
    });

    it("should return correct diagonal (reverse)", () => {
      const diagonal = grid.getDiagonal(3, 0, true);
      expect(diagonal).toEqual([
        { x: 3, y: 0, val: 3 },
        { x: 2, y: 1, val: 3 },
        { x: 1, y: 2, val: 3 },
        { x: 0, y: 3, val: 3 },
      ]);
    });
  });

  describe("checkLine", () => {
    it("should find horizontal matches", () => {
      const cells = [
        { x: 0, y: 0, val: 1 },
        { x: 0, y: 1, val: 1 },
        { x: 0, y: 2, val: 1 },
        { x: 0, y: 3, val: 2 },
      ];
      const matches = Grid.checkLine(cells);
      expect(matches).toEqual(["0,0", "0,1", "0,2"]);
    });

    it("should handle wildcards in matches", () => {
      const cells = [
        { x: 0, y: 0, val: 1 },
        { x: 0, y: 1, val: WILDCARD_INDEX },
        { x: 0, y: 2, val: 1 },
        { x: 0, y: 3, val: 2 },
      ];
      const matches = Grid.checkLine(cells);
      expect(matches).toEqual(["0,0", "0,1", "0,2"]);
    });

    it("should skip rockets in matches", () => {
      const cells = [
        { x: 0, y: 0, val: 1 },
        { x: 0, y: 1, val: ROCKET_INDICES.UP },
        { x: 0, y: 2, val: 1 },
        { x: 0, y: 3, val: 1 },
      ];
      const matches = Grid.checkLine(cells);
      expect(matches).toEqual([]);
    });

    it("should find matches at end of line", () => {
      const cells = [
        { x: 0, y: 0, val: 2 },
        { x: 0, y: 1, val: 1 },
        { x: 0, y: 2, val: 1 },
        { x: 0, y: 3, val: 1 },
      ];
      const matches = Grid.checkLine(cells);
      expect(matches).toEqual(["0,1", "0,2", "0,3"]);
    });
  });

  describe("findMatches", () => {
    it("should find horizontal matches", () => {
      // Create a grid with horizontal match
      const testGrid = new Grid(4, 4, (x, y) => {
        if (x === 0 && y <= 2) return 1;
        return 0;
      });

      const matches = testGrid.findMatches();
      expect(matches).toContain("0,0");
      expect(matches).toContain("0,1");
      expect(matches).toContain("0,2");
    });

    it("should find vertical matches", () => {
      // Create a grid with vertical match
      const testGrid = new Grid(4, 4, (x, y) => {
        if (y === 0 && x <= 2) return 1;
        return 0;
      });

      const matches = testGrid.findMatches();
      expect(matches).toContain("0,0");
      expect(matches).toContain("1,0");
      expect(matches).toContain("2,0");
    });

    it("should find diagonal matches", () => {
      // Create a grid with diagonal match
      const testGrid = new Grid(4, 4, (x, y) => {
        if (x === y && x <= 2) return 1;
        return 0;
      });

      const matches = testGrid.findMatches();
      expect(matches).toContain("0,0");
      expect(matches).toContain("1,1");
      expect(matches).toContain("2,2");
    });
  });

  describe("nullOutMatches", () => {
    it("should null out matched coordinates", () => {
      const matches = ["1,1", "2,2"];
      grid.nullOutMatches(matches);

      expect(grid.get(1, 1)).toBe(null);
      expect(grid.get(2, 2)).toBe(null);
    });
  });

  describe("applyGravity", () => {
    it("should move pieces down when nulls are present", () => {
      grid.set(1, 0, null);
      grid.set(1, 1, null);
      // Column 1: [null, null, 3, 4] should become [null, null, 3, 4]
      const moved = grid.applyGravity();
      expect(moved).toBe(false); // No movement needed in this case

      // Better test case
      grid.set(1, 2, null);
      grid.set(1, 1, 5);

      const moved2 = grid.applyGravity();
      expect(moved2).toBe(true);
      expect(grid.get(1, 2)).toBe(5);
      expect(grid.get(1, 1)).toBe(null);
    });
  });

  describe("applyFullGravity", () => {
    it("should fill empty cells at the top of the grid with random values", () => {
      grid.set(1, 1, null);
      grid.set(2, 2, null);
      const mockRandom = () => 99;
      grid.applyFullGravity(mockRandom);

      expect(grid.get(1, 0)).toBe(99);
      expect(grid.get(2, 0)).toBe(99);
    });
  });

  describe("wouldCreateMatch", () => {
    it("should detect potential horizontal matches", () => {
      // Set up a scenario where placing a value would create a match
      grid.set(0, 0, 1);
      grid.set(0, 1, 1);
      grid.set(0, 2, 99); // Different value

      const wouldMatch = grid["wouldCreateMatch"](0, 2, 1);
      expect(wouldMatch).toBe(true);
    });

    it("should return false for rockets", () => {
      const wouldMatch = grid["wouldCreateMatch"](0, 0, ROCKET_INDICES.UP);
      expect(wouldMatch).toBe(false);
    });
  });

  describe("swap", () => {
    it("should swap two cell values", () => {
      const val1 = grid.get(0, 0);
      const val2 = grid.get(1, 1);

      grid.swap(0, 0, 1, 1);

      expect(grid.get(0, 0)).toBe(val2);
      expect(grid.get(1, 1)).toBe(val1);
    });
  });

  describe("clone", () => {
    it("should create an identical copy", () => {
      const cloned = grid.clone();

      expect(cloned.getWidth()).toBe(grid.getWidth());
      expect(cloned.getLength()).toBe(grid.getLength());

      for (let x = 0; x < grid.getWidth(); x++) {
        for (let y = 0; y < grid.getLength(); y++) {
          expect(cloned.get(x, y)).toBe(grid.get(x, y));
        }
      }
    });

    it("should be independent of original", () => {
      const cloned = grid.clone();
      cloned.set(0, 0, 999);

      expect(grid.get(0, 0)).not.toBe(999);
    });
  });

  describe("map", () => {
    it("should apply function to all cells", () => {
      const result = grid.map((x, y, val) => ({ x, y, val }));

      expect(result[0][0]).toEqual({ x: 0, y: 0, val: 0 });
      expect(result[1][1]).toEqual({ x: 1, y: 1, val: 2 });
    });

    it("should raster left to right and top to bottom", () => {
      let counter = 0;
      const result = grid.map((x, y, _) => ({ x, y, val: counter++ }));

      expect(result[0][0]).toEqual({ x: 0, y: 0, val: 0 });
      expect(result[1][1]).toEqual({ x: 1, y: 1, val: 5 });
    });
  });
});
