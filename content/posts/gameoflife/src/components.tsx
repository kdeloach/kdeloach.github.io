import { CellGrid, MapCallback } from "./gameoflife";
import React, { useState, useEffect } from "react";

const ROWS = 20;
const COLS = 40;

const TIMEOUT_INTERVAL = 100;

// prettier-ignore
const GLIDER = new CellGrid(3, 3, [
    0, 1, 0,
    0, 0, 1,
    1, 1, 1,
]);

// prettier-ignore
const PULSAR = new CellGrid(13, 13, [
    0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1,
    1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1,
    1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1,
    0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0,
    1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1,
    1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1,
    1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0,
]);

const initialValue: MapCallback<number> = ({ x, y }) => {
    const offset = { x: 0, y: 0 };
    return GLIDER.cellAt(x - offset.x, y - offset.y) || 0;
    // const offset = { x: 13, y: 3 };
    // return PULSAR.cellAt(x - offset.x, y - offset.y) || 0;
};

const cellStyle = (value: number) => {
    const c = 255 * (1 - value);
    return {
        backgroundColor: `rgb(${c}, ${c}, ${c})`,
    };
};

const conwayRules: MapCallback<number> = ({ cell, neighbors }) => {
    if (cell === 1 && (neighbors.length === 2 || neighbors.length === 3)) {
        return 1;
    } else if (cell === 0 && neighbors.length === 3) {
        return 1;
    }
    return 0;
};

export const GameOfLife: React.FC = () => {
    const [mouseDown, setMouseDown] = useState(false);
    const [paused, setPaused] = useState(false);
    const [grid, setGrid] = useState(new CellGrid<number>(ROWS, COLS).map(initialValue));

    useEffect(() => {
        if (paused) {
            return;
        }
        let id: any;
        const queueNextFrame = () => {
            step();
            id = setTimeout(queueNextFrame, TIMEOUT_INTERVAL);
        };
        id = setTimeout(queueNextFrame, TIMEOUT_INTERVAL);
        return () => clearTimeout(id);
    }, [paused]);

    useEffect(() => {
        const onKeyUp = (e: KeyboardEvent) => {
            if (e.key === " ") {
                togglePause();
            }
        };
        document.addEventListener("keyup", onKeyUp);
        return () => document.removeEventListener("keyup", onKeyUp);
    }, [paused]);

    const togglePause = () => setPaused((paused) => !paused);

    const step = () => {
        setGrid((grid) => grid.map(conwayRules));
    };

    const reset = () => {
        setGrid(grid.map(initialValue));
    };

    const toggle = (x: number, y: number) => {
        grid.setCell(x, y, 1 - grid.cellAt(x, y));
        setGrid((grid) => new CellGrid(ROWS, COLS, grid.cells));
    };

    const rows = [];
    for (let y = 0; y < grid.rows; y++) {
        const cols = [];
        for (let x = 0; x < grid.cols; x++) {
            cols.push(
                <div
                    key={`${x}-${y}`}
                    data-x={x}
                    data-y={y}
                    className="cell"
                    style={cellStyle(grid.cellAt(x, y))}
                    onMouseDown={() => toggle(x, y)}
                    onMouseEnter={() => mouseDown && toggle(x, y)}
                ></div>
            );
        }
        rows.push(
            <div key={`row-${y}`} className="row">
                {cols}
            </div>
        );
    }

    return (
        <div
            onMouseDown={(e) => {
                e.preventDefault();
                setMouseDown(true);
            }}
            onMouseUp={() => setMouseDown(false)}
        >
            <div className="grid">{rows}</div>
            <div className="actions">
                <button onClick={togglePause}>{(paused && "Play") || "Pause"}</button>
                <button onClick={step}>Step</button>
                <button onClick={reset}>Reset</button>
            </div>
        </div>
    );
};
