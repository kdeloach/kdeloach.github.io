export type CallbackArgs<T> = {
    i: number;
    x: number;
    y: number;
    cell: T;
};
export type MapCallback<T> = (args: CallbackArgs<T>) => T;
export type ForEachCallback<T> = (args: CallbackArgs<T>) => void;

export class CellGrid<T> {
    constructor(
        readonly rows: number,
        readonly cols: number,
        readonly cells: T[] = [],
    ) {}

    map(cb: MapCallback<T>): CellGrid<T> {
        const cells: T[] = [];
        this.forEach((args) => {
            cells[args.i] = cb(args);
        });
        return new CellGrid(this.rows, this.cols, cells);
    }

    forEach(cb: ForEachCallback<T>) {
        for (let i = 0; i < this.rows * this.cols; i++) {
            const x = i % this.cols;
            const y = Math.floor(i / this.cols);
            const cell = this.cells[i];
            cb({ i, x, y, cell });
        }
    }

    cellAt(x: number, y: number): T {
        if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) {
            return undefined;
        }
        return this.cells[y * this.cols + x];
    }

    neighbors(x: number, y: number): T[] {
        // prettier-ignore
        return [
            this.cellAt(x - 1, y),
            this.cellAt(x + 1, y),
            this.cellAt(x, y - 1),
            this.cellAt(x, y + 1),
            this.cellAt(x - 1, y - 1),
            this.cellAt(x - 1, y + 1),
            this.cellAt(x + 1, y - 1),
            this.cellAt(x + 1, y + 1),
        ].filter((n) => n);
    }

    setCell(x: number, y: number, value: T) {
        const i = y * this.cols + x;
        this.cells[i] = value;
    }
}
