export default class Grid {
  private readonly width: number;
  private readonly length: number;
  private readonly grid: (number | null)[][];
  constructor(
    width: number,
    length: number,
    setter: (x: number, y: number) => number | null,
  ) {
    this.length = length;
    this.width = width;
    this.grid = Array.from({ length: width }, (_, x) =>
      Array.from({ length }, (_, y) => setter(x, y)),
    );
  }

  subset = (x1: number, y1: number, x2: number, y2: number) => {
    if (
      x1 < 0 ||
      y1 < 0 ||
      x2 < 0 ||
      y2 < 0 ||
      y1 > this.length ||
      y2 > this.length ||
      x1 > this.width ||
      y2 > this.width
    ) {
      throw new Error("Subset out of range!");
    }
    return this.grid.slice(x1, x2).map((row) => row.slice(y1, y2));
  };

  hasNulls = () => {
    return this.grid.some((row) => row.some((cell) => cell === null));
  };

  nullCoords = (arr: string[]) => {
    arr.forEach((coords) => {
      const [x, y] = coords.split(",").map((el) => Number(el));
      this.set(x, y, null);
    });
  };

  set = (x: number, y: number, val: number | null) => {
    this.grid[x][y] = val;
    return this.grid;
  };

  get = (x: number, y: number) => {
    return this.grid[x][y];
  };

  getRow = (x: number) => {
    return this.grid[x].map((el, y) => {
      return { x, y, val: el };
    });
  };

  getCol = (y: number) => {
    const col = [];
    for (let i = 0; i < this.length; i++) {
      col.push({
        x: i,
        y,
        val: this.get(i, y),
      });
    }
    return col;
  };

  getDiagonal = (
    startX: number,
    startY: number,
    isReverse: boolean = false,
  ) => {
    const diagonal = [];
    for (
      let i = 0;
      startY + i < this.length &&
      (isReverse ? startX - i >= 0 : startX + i < this.width);
      i++
    ) {
      const y = startY + i;
      const x = isReverse ? startX - i : startX + i;
      diagonal.push({ val: this.get(x, y), x, y });
    }
    return diagonal;
  };

  // Helper to check a line (row, column, or diagonal) for matches
  static checkLine = (cells) => {
    let last: number | null = null;
    let count = 0;
    const lineMatches = [];
    cells.forEach(({ val, x, y }, index) => {
      if (val === last) {
        count++;
      } else {
        if (count >= 3) {
          // Add the matched positions (last 'count' items)
          lineMatches.push(
            ...cells.slice(index - count, index).map((c) => `${c.x},${c.y}`),
          );
        }
        last = val;
        count = 1;
      }
    });
    // Check for matches at the end of the line
    if (count >= 3) {
      lineMatches.push(...cells.slice(-count).map((c) => `${c.x},${c.y}`));
    }
    return lineMatches;
  };

  findMatches = () => {
    const matches = [];

    // Horizontal (rows)
    for (let x = 0; x < this.width; x++) {
      const row = this.getRow(x);
      matches.push(...Grid.checkLine(row));
    }

    // Vertical (columns)
    for (let y = 0; y < this.length; y++) {
      const col = this.getCol(y);
      matches.push(...Grid.checkLine(col));
    }

    // Diagonals (top-left to bottom-right)
    for (let startY = 0; startY < this.length; startY++) {
      for (let startX = 0; startX < this.width; startX++) {
        const diagonal = this.getDiagonal(startX, startY);
        if (diagonal.length >= 3) {
          matches.push(...Grid.checkLine(diagonal));
        }
      }
    }

    // Diagonals (top-right to bottom-left)
    for (let startY = 0; startY < this.length; startY++) {
      for (let startX = this.width - 1; startX >= 0; startX--) {
        const diagonal = this.getDiagonal(startX, startY, true);
        if (diagonal.length >= 3) {
          matches.push(...Grid.checkLine(diagonal));
        }
      }
    }

    // Remove duplicates (in case of overlapping matches)
    return [...new Set(matches)];
  };

  nullOutMatches = (matches) => {
    matches.forEach((coords) => {
      const [x, y] = coords.split(",").map((el) => Number(el));
      this.set(x, y, null);
    });
    return this;
  };

  applyGravity = (randomValueGenerator) => {
    let moved = false;

    // Move cells down one step at a time
    for (let y = this.length - 2; y >= 0; y--) {
      for (let x = 0; x < this.width; x++) {
        if (this.get(x, y) !== null && this.get(x, y + 1) === null) {
          this.swap(x, y, x, y + 1);
          moved = true;
        }
      }
    }

    // Fill empty cells at the top with new values
    for (let x = 0; x < this.width; x++) {
      if (this.get(x, 0) === null) {
        const currentMatches = this.findMatches().length;
        do {
          this.set(x, 0, randomValueGenerator());
        } while (this.findMatches().length > currentMatches);

        moved = true;
      }
    }

    return moved;
  };

  applyFullGravity = (randomValueGenerator) => {
    let moved;
    do {
      moved = this.applyGravity(randomValueGenerator);
    } while (moved);

    return this;
  };

  swap = (x1, y1, x2, y2) => {
    const temp = this.get(x1, y1);
    this.set(x1, y1, this.get(x2, y2));
    this.set(x2, y2, temp);
  };

  clone = () => {
    return new Grid(this.width, this.length, (x, y) => this.get(x, y));
  };

  map = (fn) => {
    return this.grid.map((col, x) => col.map((val, y) => fn(x, y, val)));
  };
}
