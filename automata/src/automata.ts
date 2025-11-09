export class Matrix {
    private data: number[][];
    private translateCol: number;
    private translateRow: number;

    constructor(
        public readonly cols: number,
        public readonly rows: number,
        data?: number[][],
    ) {
        if (data) {
            this.data = data;
        } else {
            this.data = [];
            for (let row = 0; row < rows; row++) {
                this.data[row] = [];
                for (let col = 0; col < cols; col++) {
                    this.data[row][col] = 0;
                }
            }
        }
        this.translateCol = 0;
        this.translateRow = 0;
    }

    set(col: number, row: number, value: number) {
        this.data[row + this.translateRow][col + this.translateCol] = value;
    }

    get(col: number, row: number): number {
        return this.data[row + this.translateRow][col + this.translateCol];
    }

    inBounds(col: number, row: number): boolean {
        return col >= 0 && col < this.cols && row >= 0 && row < this.rows;
    }

    forEach(fn: (col: number, row: number, value: number) => void): Matrix {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                fn(col, row, this.get(col, row));
            }
        }
        return this;
    }

    randomize(): Matrix {
        return this.forEach((col: number, row: number, value: number) => {
            // this.set(col, row, Math.random());
            this.set(col, row, Math.round(Math.random()));
            // this.set(col, row, Math.random() > 0.5 ? 1 : 0);
        });
    }

    normalize(): Matrix {
        let hi = 0;
        this.forEach((col: number, row: number, value: number) => {
            if (value > hi) {
                hi = value;
            }
        });

        if (hi === 0) {
            return this;
        }

        console.log(hi);

        return this.forEach((col: number, row: number, value: number) => {
            // this.set(col, row, value > 0 ? 1 : 0);
            this.set(col, row, value / hi);
        });
    }

    reset(): Matrix {
        return this.forEach((col: number, row: number, value: number) => {
            this.set(col, row, 0);
        });
    }

    clone(): Matrix {
        return new Matrix(this.cols, this.rows, this.data);
    }

    slidingWindow(cols: number, rows: number, fn: (col: number, row: number, subGrid: Matrix) => void) {
        const slice = this.slice(cols, rows);
        for (let row = 0; row <= this.rows - rows; row++) {
            for (let col = 0; col <= this.cols - cols; col++) {
                slice.translate(col, row);
                fn(col, row, slice);
                slice.resetTranslate();
            }
        }
    }

    *slidingWindowIter(cols: number, rows: number) {
        const slice = this.slice(cols, rows);
        for (let row = 0; row <= this.rows - rows; row++) {
            for (let col = 0; col <= this.cols - cols; col++) {
                slice.translate(col, row);
                yield { col, row, subGrid: slice };
                slice.resetTranslate();
            }
        }
    }

    slice(cols: number, rows: number): Matrix {
        const m = new Matrix(cols, rows, this.data);
        m.translate(this.translateCol, this.translateRow);
        return m;
    }

    translate(col: number, row: number): Matrix {
        this.translateCol += col;
        this.translateRow += row;
        return this;
    }

    resetTranslate(): Matrix {
        this.translateCol = 0;
        this.translateRow = 0;
        return this;
    }

    addTo(target: Matrix): Matrix {
        return this.forEach((col: number, row: number, value: number) => {
            const n = addCell(target.get(col, row), value);
            target.set(col, row, n);
        });
    }

    copyTo(target: Matrix): Matrix {
        return this.forEach((col: number, row: number, value: number) => {
            target.set(col, row, value);
        });
    }

    equals(other: Matrix): boolean {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (!cellsEqual(this.get(col, row), other.get(col, row))) {
                    return false;
                }
            }
        }
        return true;
    }
}

// Logic to determine if cells are equal within an epsilon value.
function cellsEqual(a: number, b: number): boolean {
    // return Math.abs(a - b) < 1;
    // return Math.floor(a) == Math.floor(b);
    a = a == 1 ? 1 : 0;
    b = b == 1 ? 1 : 0;
    return a == b;
}

// Logic to combine 2 cell values. Map normalized values to signed range so
// that dead cells can reduce the value of target cells.
function addCell(a: number, b: number): number {
    return a + b;
    a = normToSigned(a);
    b = normToSigned(b);
    // return signedToNorm(clampSigned(a + b));
    return signedToNorm(a + b);
}

// Maps a value from the 0–1 range to the -1–1 range.
function normToSigned(x: number): number {
    return x * 2 - 1;
}

// Maps a value from the -1–1 range back to the 0–1 range.
function signedToNorm(x: number): number {
    return (x + 1) / 2;
}

// Clamp signed value to range -1-1.
function clampSigned(x: number): number {
    return Math.min(1, Math.max(-1, x));
}

export class Rule {
    constructor(
        public readonly input: Matrix,
        public readonly output: Matrix,
    ) {}
}
