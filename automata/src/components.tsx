import React, { createContext, useRef, useEffect, useContext, useState, useCallback } from "react";
import { Matrix, Rule } from "./automata";

const FPS = 10; // target FPS
const FRAME_INTERVAL = 1000 / FPS;

const GAP = 1;
const CELL_SIZE = 25; // excluding gap

interface DebugRenderCmd {
    cmd: "render-sliding-window" | "highlight-grid";

    // highlight-grid
    grid?: string;

    // render-sliding-window
    col?: number;
    row?: number;
}

interface SceneContextType {
    frameCount: number;
    debugRenderCmds: DebugRenderCmd[];
}

const SceneContext = createContext<SceneContextType>(null);

interface RuleGridProps {
    rule: Rule;
    id: string;
}

function RuleGrid({ rule, id }: RuleGridProps) {
    return (
        <div className="flex gap-1">
            <Grid grid={rule.input} id={`${id}-input`} />
            <Grid grid={rule.output} id={`${id}-output`} />
        </div>
    );
}

interface GridProps {
    grid: Matrix;
    id: string;
}

function Grid({ grid, id }: GridProps) {
    const { frameCount, debugRenderCmds } = useContext(SceneContext);
    const ref = useRef<HTMLCanvasElement>();
    const redrawRef = useRef(null);

    const [mouseX, setMouseX] = useState(-1);
    const [mouseY, setMouseY] = useState(-1);
    const [value, setValue] = useState(0);

    const redraw = () => {
        // redrawRef.current();
        const canvas = ref.current;
        if (canvas) {
            renderGrid(canvas, grid);
            renderGridDebug(canvas, id, debugRenderCmds);
        }
    };

    useEffect(() => {
        if (!ref) {
            return;
        }
        const canvas = ref.current;
        canvas.width = getCanvasSize(grid.cols);
        canvas.height = getCanvasSize(grid.rows);
        // redrawRef.current = () => renderGrid(canvas, grid);
    }, [ref]);

    useEffect(() => {
        const canvas = ref.current;
        if (canvas) {
            renderGrid(canvas, grid);
            renderGridDebug(canvas, id, debugRenderCmds);
        }
    }, [frameCount, debugRenderCmds]);

    const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const mouseDown = e.buttons & 1;
        if (!mouseDown || mouseX === -1 || mouseY === -1) {
            return;
        }

        const { offsetX, offsetY } = e.nativeEvent;

        const oldCol = screenToGridCoord(mouseX);
        const oldRow = screenToGridCoord(mouseY);
        const newCol = screenToGridCoord(offsetX);
        const newRow = screenToGridCoord(offsetY);

        setMouseX(offsetX);
        setMouseY(offsetY);

        const enteredNewCell = oldCol !== newCol || oldRow !== newRow;

        if (enteredNewCell && grid.inBounds(newCol, newRow)) {
            grid.set(newCol, newRow, value);
            redraw();
        }
    };

    const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const { offsetX, offsetY } = e.nativeEvent;

        const newCol = screenToGridCoord(offsetX);
        const newRow = screenToGridCoord(offsetY);

        setMouseX(offsetX);
        setMouseY(offsetY);

        // Grab color of cell under cursor (and toggle it) for drag-and-paint.
        const value = grid.get(newCol, newRow) === 1 ? 0 : 1;
        setValue(value);
        grid.set(newCol, newRow, value);
        redraw();
    };

    return <canvas ref={ref} onMouseDown={onMouseDown} onMouseMove={onMouseMove} />;
}

function getCanvasSize(n: number): number {
    return n * (CELL_SIZE + GAP) + GAP;
}

function renderGridDebug(canvas: HTMLCanvasElement, gridID: string, debugRenderCmds: DebugRenderCmd[]) {
    const ctx = canvas.getContext("2d");

    ctx.save();
    ctx.strokeStyle = "#00FF00";
    ctx.lineWidth = 3;

    debugRenderCmds.forEach((cmd) => {
        switch (cmd.cmd) {
            case "highlight-grid":
                if (cmd.grid != gridID) {
                    return;
                }
                ctx.strokeRect(0, 0, canvas.width, canvas.height);
                break;
            case "render-sliding-window":
                if (gridID !== "main") {
                    return;
                }
                const { col, row } = cmd;
                const x = col * (CELL_SIZE + GAP) + GAP;
                const y = row * (CELL_SIZE + GAP) + GAP;
                const s = CELL_SIZE * 3;
                ctx.strokeRect(x + 1, y + 1, s, s);
                break;
        }
    });

    ctx.restore();
}

function renderGrid(canvas: HTMLCanvasElement, grid: Matrix) {
    const ctx = canvas.getContext("2d");

    grid.forEach((col: number, row: number, value: number) => {
        const x = col * (CELL_SIZE + GAP) + GAP;
        const y = row * (CELL_SIZE + GAP) + GAP;
        const s = CELL_SIZE;

        ctx.fillStyle = `white`;
        ctx.fillRect(x, y, s, s);

        ctx.fillStyle = `rgba(0, 0, 0, ${value})`;
        ctx.fillRect(x, y, s, s);
    });

    ctx.strokeStyle = "black";

    for (let n = 0; n <= grid.rows; n++) {
        // Offset by 0.5 to draw 1px line...
        const x = n * (CELL_SIZE + GAP) + GAP - 0.5;
        const y = n * (CELL_SIZE + GAP) + GAP - 0.5;

        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
}

function screenToGridCoord(n: number) {
    n -= GAP;
    return Math.floor(n / (CELL_SIZE + GAP));
}

function newRandomGrid(): Matrix {
    return new Matrix(10, 10).randomize();
}

function newRules(): Rule[] {
    const rules: Rule[] = [];

    const addRule = (inputData: number[][], outputData: number[][]) => {
        // const input = new Matrix(3, 3, inputData).randomize().normalize();
        // const output = new Matrix(3, 3, outputData).randomize().normalize();
        const input = new Matrix(3, 3, inputData);
        const output = new Matrix(3, 3, outputData);
        rules.push(new Rule(input, output));
    };

    addRule(
        [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
        ],
        [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
        ],
    );

    addRule(
        [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
        ],
        [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
        ],
    );

    addRule(
        [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
        ],
        [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
        ],
    );

    return rules;
}

function* newStepIterator(grid: Matrix, rules: Rule[]) {
    // const newGrid = new Matrix(grid.cols, grid.rows);
    // grid.copyTo(newGrid);

    const drawCmds = [];

    for (const { col, row, subGrid } of grid.slidingWindowIter(3, 3)) {
        drawCmds.push({ cmd: "render-sliding-window", col, row });
        // yield drawCmds;

        for (let i = 0; i < rules.length; i++) {
            const rule = rules[i];
            drawCmds.push({ cmd: "highlight-grid", grid: `rule-${i}-input` });
            // yield drawCmds;

            if (rule.input.equals(subGrid)) {
                drawCmds.push({ cmd: "highlight-grid", grid: `rule-${i}-output` });
                yield drawCmds;

                grid.translate(col, row);
                rule.output.addTo(grid);
                grid.resetTranslate();
                // grid.normalize();

                drawCmds.pop(); // rule output
            }
            drawCmds.pop(); // rule input
        }
        drawCmds.pop(); // sliding window
    }

    grid.normalize();

    // newGrid.normalize().copyTo(grid);
}

// type DrawFunc = (canvas: HTMLCanvasElement) => void;
//
// class DrawQueue {
//     private start: number = 0;
//     private drawFuncs: DrawFunc[];
//
//     add(drawFunc: DrawFunc) {
//         this.drawFuncs.push(drawFunc);
//     }
//
//     draw(ctx: CanvasRenderingContext2D) {
//         for (let i = this.start; i < this.drawFuncs.length; i++) {
//             const drawFunc = this.drawFuncs[i];
//             drawFunc(ctx);
//         }
//     }
//
//     pop() {
//         this.start++;
//     }
//
//     isEmpty() {
//         return this.start >= this.drawFuncs.length;
//     }
// }

// function queueAnimations(grid: Matrix, rules: Rule[]) {
//     const origGrid = grid.clone();
//
//     const animations = new DrawQueue();
//
//     grid.slidingWindow(3, 3, (col: number, row: number, subGrid: Matrix) => {
//         animations.add((ctx) => {
//             drawSlidingWindow(ctx, col, row);
//         });
//
//         for (let i = 0; i < rules.length; i++) {
//             const rule = rules[i];
//
//             let skipID = animations.add((ctx) => {
//                 highlightRuleInput(i);
//             });
//
//             if (rule.input.equals(subGrid)) {
//                 animations.add((ctx) => {
//                     highlightRuleOutput(i);
//                 });
//                 break;
//             }
//         }
//
//         const rule = rules.find((r) => r.input.equals(subGrid));
//
//         if (rule) {
//             newGrid.translate(col, row);
//             rule.output.addTo(newGrid);
//             newGrid.resetTranslate();
//         }
//     });
//
//     return animations;
// }

function highlightRuleInput(i: number) {
    // TODO: mark all rules as unhighlighted except for i
}

function highlightRuleOutput(i: number) {
    // TODO: mark all rules as unhighlighted except for i
}

export function AutomataForm() {
    const [grid, setGrid] = useState<Matrix>(() => newRandomGrid());
    const [rules, setRules] = useState<Rule[]>(() => newRules());
    const [paused, setPaused] = useState(false);

    const stepIter = useRef(null);
    const [frameCount, setFrameCount] = useState(0);
    const [debugRenderCmds, setDebugRenderCmds] = useState<DebugRenderCmd[]>([]);
    const sceneContext: SceneContextType = { frameCount, debugRenderCmds };

    const redraw = () => setFrameCount((n) => n + 1);

    const randomize = () => {
        grid.randomize();
        redraw();
    };

    const reset = () => {
        grid.reset();
        redraw();
    };

    const step = () => {
        if (!stepIter.current) {
            stepIter.current = newStepIterator(grid, rules);
        }

        const res = stepIter.current.next();
        // TODO: render draw cmds
        setDebugRenderCmds(res.value || []);

        if (res.done) {
            stepIter.current = null;
        }

        redraw();
        // TODO: clone and call setRules to force redraw rule grids
        // if animation queue is full
        // update(grid, rules);
        // redraw();
    };

    // Animation loop
    useEffect(() => {
        if (paused) {
            return;
        }

        let lastUpdateTime = 0;
        var frameID: number;
        let canceled = false;

        function animate(currentTime: number) {
            if (canceled) {
                return;
            }
            const deltaTime = currentTime - lastUpdateTime;
            if (deltaTime >= FRAME_INTERVAL) {
                step();
                lastUpdateTime = currentTime;
            }
            frameID = requestAnimationFrame(animate);
        }

        frameID = requestAnimationFrame(animate);

        return () => {
            canceled = true;
            cancelAnimationFrame(frameID);
        };
    }, [paused]);

    return (
        <SceneContext.Provider value={sceneContext}>
            <div className="flex flex-col gap-3">
                <div className="flex gap-3">
                    <Grid grid={grid} id="main" />
                    <div className="flex flex-col gap-3">
                        {rules.map((rule, i) => (
                            <RuleGrid key={i} rule={rule} id={`rule-${i}`} />
                        ))}
                    </div>
                </div>
                <div className="flex gap-1">
                    <button onClick={() => randomize()}>Randomize</button>
                    <button onClick={() => reset()}>Clear</button>
                    <button onClick={() => setPaused((paused) => !paused)}>{paused ? "Unpause" : "Pause"}</button>
                    <button onClick={() => paused && step()}>Step</button>
                </div>
            </div>
        </SceneContext.Provider>
    );
}
