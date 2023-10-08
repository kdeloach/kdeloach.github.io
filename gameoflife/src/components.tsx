import React, { useState, useEffect } from "react";
import { CellGrid, MapCallback } from "./gameoflife";

const ROWS = 40;
const COLS = 40;

const TIMEOUT_INTERVAL = 100;

const ERASER = new CellGrid(1, 1, [0]);

const DOT = new CellGrid(1, 1, [1]);

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
    return GLIDER.cellAt(x, y) || PULSAR.cellAt(x - 14, y - 14) || 0;
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
    const [brush, setBrush] = useState(DOT);
    const [frame, setFrame] = useState(0);

    useEffect(() => {
        if (paused || mouseDown) {
            return;
        }
        const timeoutID = setTimeout(() => {
            step();
            setFrame((frame) => (frame + 1) % 1000);
        }, TIMEOUT_INTERVAL);
        return () => clearTimeout(timeoutID);
    }, [paused, mouseDown, frame]);

    useEffect(() => {
        const onKeyUp = (e: KeyboardEvent) => {
            if (e.key === " ") {
                togglePause();
            }
        };
        document.addEventListener("keyup", onKeyUp);
        return () => document.removeEventListener("keyup", onKeyUp);
    }, []);

    const togglePause = () => setPaused((paused) => !paused);

    const step = () => setGrid((grid) => grid.map(conwayRules));

    const reset = () => {
        setGrid(grid.map(initialValue));
    };

    const drawBrush = (mx: number, my: number) => {
        setGrid((grid) =>
            new CellGrid<number>(ROWS, COLS).map(({ x, y }) => brush.cellAt(x - mx, y - my) ?? grid.cellAt(x, y)),
        );
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
                    onMouseDown={() => drawBrush(x, y)}
                    onMouseEnter={() => mouseDown && drawBrush(x, y)}
                ></div>,
            );
        }
        rows.push(
            <div key={`row-${y}`} className="row">
                {cols}
            </div>,
        );
    }

    return (
        <>
            <div
                className="grid"
                onMouseDown={(e) => {
                    e.preventDefault();
                    setMouseDown(true);
                }}
                onMouseUp={() => setMouseDown(false)}
            >
                {rows}
            </div>
            <div className="brushes">
                <button onClick={() => setBrush(DOT)}>{(brush === DOT && "[Dot]") || "Dot"}</button>
                <button onClick={() => setBrush(GLIDER)}>{(brush === GLIDER && "[Glider]") || "Glider"}</button>
                <button onClick={() => setBrush(PULSAR)}>{(brush === PULSAR && "[Pulsar]") || "Pulsar"}</button>
                <button onClick={() => setBrush(ERASER)}>{(brush === ERASER && "[Eraser]") || "Eraser"}</button>
            </div>
            <div className="actions">
                <button onClick={togglePause}>{(paused && "Play") || "Pause"}</button>
                <button onClick={step}>Step</button>
                <button onClick={reset}>Reset</button>
            </div>
        </>
    );
};
