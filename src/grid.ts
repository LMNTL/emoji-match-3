export default class Grid {
    private readonly width: number;
    private readonly length: number;
    private readonly grid: (number|null)[][];
    constructor(width, length, setter) {
        this.length = length;
        this.width = width;
        this.grid = Array.from({ length: width },
            (row, x) => Array.from({ length },
                (col, y) => setter(x, y))
        );
    }

    subset = (x1, y1, x2, y2) => {
        if(x1 < 0 || y1 < 0 || x2 < 0 || y2 < 0 ||
            y1 > this.length || y2 > this.length || x1 > this.width || y2 > this.width){
            throw new Error('Subset out of range!')
        }
        return this.grid.slice(x1, x2).map(row => row.slice(y1, y2));
    }

    hasNulls = () => {
        return this.grid.some(row => row.some(cell => cell === null));
    }
    
    nullCoords = (arr: string[]) => {
        arr.forEach(coords => {
            const [x, y] = coords.split(',').map(el => Number(el));
            this.set(x, y, null);
        });
    }

    set = (x, y, val) => {
        this.grid[x][y] = val;
        return this.grid;
    }

    get = (x, y) => {
        return this.grid[x][y];
    }

    getRow = (x) => {
        return this.grid[x].map((el, y) => {
            return {x, y, val: el};
        });
    }

    getCol = (y) => {
        const col = [];
        for(let i = 0; i < this.length; i++){
            col.push({
                x: i,
                y,
                val: this.get(i, y),
            })
        }
        return col;
    }

    swap = (x1, y1, x2, y2) => {
      const temp = this.get(x1, y1);
      this.set(x1, y1, this.get(x2, y2));
      this.set(x2, y2, temp);
    }

    clone = () => {
        return new Grid(this.width, this.length, (x, y) => this.get(x, y));
    }

    map = (fn) => {
        return this.grid.map((col, x) =>
            col.map((val, y) =>
                fn(x, y, val)
            )
        );
    }
}