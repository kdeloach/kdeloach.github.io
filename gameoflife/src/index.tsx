import { CellGrid, MapCallback } from "./gameoflife";

const el = document.getElementById("sketch");
const canvas = document.createElement("canvas");
el.appendChild(canvas);

const ctx = canvas.getContext("2d");

const COLS = 40;
const ROWS = 30;

const windowWidth = el.clientWidth;
const windowHeight = (ROWS / COLS) * windowWidth; // maintain aspect ratio

const cellWidth = Math.round(windowWidth / COLS);
const cellHeight = Math.round(windowHeight / ROWS);

let lastUpdateTime = 0;
const frameInterval = 1000 / 10; // FPS

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

// const initialValue: MapCallback<number> = ({ x, y }) => {
//     // 14 = COLS/2 - PULSAR.cols/2 = 40/2 - 13/2
//     // 9 = ROWS/2 - PULSAR.rows/2 = 30/2 - 13/2
//     return GLIDER.cellAt(x, y) || PULSAR.cellAt(x - 14, y - 9) || 0;
// };

let paused = false;
let brush = DOT;
let grid = new CellGrid<number>(ROWS, COLS);
let mousedown = false;

const conwayRules: MapCallback<number> = ({ cell, x, y }) => {
    const neighbors = grid.neighbors(x, y);
    if (cell === 1 && (neighbors.length === 2 || neighbors.length === 3)) {
        return 1;
    } else if (cell === 0 && neighbors.length === 3) {
        return 1;
    }
    return 0;
};

function main() {
    canvas.width = windowWidth;
    canvas.height = windowHeight;

    document.addEventListener("keydown", (e) => {
        if (e.key === "p") {
            togglePause();
        } else if (e.key === "r") {
            randomize();
        } else if (e.key === "s") {
            update();
        } else if (e.key === "c") {
            clear();
        } else if (e.key === "1") {
            setBrush(DOT);
        } else if (e.key === "2") {
            setBrush(GLIDER);
        } else if (e.key === "3") {
            setBrush(PULSAR);
        } else if (e.key === "4") {
            setBrush(ERASER);
        }
    });

    canvas.addEventListener("mousedown", (e: MouseEvent) => {
        mousedown = true;
        draw(e);
    });

    canvas.addEventListener("mouseup", (e: MouseEvent) => {
        mousedown = false;
    });

    canvas.addEventListener("mousemove", (e: MouseEvent) => {
        if (!mousedown) {
            return;
        }
        draw(e);
    });

    const draw = (e: MouseEvent) => {
        const canvasRect = canvas.getBoundingClientRect();
        const x = e.clientX - canvasRect.left;
        const y = e.clientY - canvasRect.top;

        const gridX = Math.floor(x / cellWidth);
        const gridY = Math.floor(y / cellHeight);

        grid = grid.map(({ x, y }) => brush.cellAt(x - gridX, y - gridY) ?? grid.cellAt(x, y));
    };

    const controls = document.createElement("div");
    controls.className = "controls";
    el.appendChild(controls);

    // Play/pause button
    const playButton = document.createElement("button");
    playButton.textContent = "Pause";
    const togglePause = () => {
        paused = !paused;
        if (paused) {
            playButton.textContent = "Play";
        } else {
            playButton.textContent = "Pause";
        }
    };
    playButton.onclick = togglePause;
    controls.appendChild(playButton);

    // Step button
    const stepButton = document.createElement("button");
    stepButton.textContent = "Step";
    stepButton.onclick = update;
    controls.appendChild(stepButton);

    // // Reset button
    // const resetButton = document.createElement("button");
    // resetButton.textContent = "Reset";
    // resetButton.onclick = reset;
    // controls.appendChild(resetButton);

    // Clear button
    const clearButton = document.createElement("button");
    clearButton.textContent = "Clear";
    clearButton.onclick = clear;
    controls.appendChild(clearButton);

    // Dot brush
    const dotBrush = document.createElement("button");
    dotBrush.textContent = "[Dot]";
    dotBrush.onclick = () => setBrush(DOT);
    controls.appendChild(dotBrush);

    // Glider brush
    const gliderBrush = document.createElement("button");
    gliderBrush.textContent = "Glider";
    gliderBrush.onclick = () => setBrush(GLIDER);
    controls.appendChild(gliderBrush);

    // Pulsar brush
    const pulsarBrush = document.createElement("button");
    pulsarBrush.textContent = "Pulsar";
    pulsarBrush.onclick = () => setBrush(PULSAR);
    controls.appendChild(pulsarBrush);

    // Eraser brush
    const eraserBrush = document.createElement("button");
    eraserBrush.textContent = "Eraser";
    eraserBrush.onclick = () => setBrush(ERASER);
    controls.appendChild(eraserBrush);

    // Randomize brush
    const randomizeButton = document.createElement("button");
    randomizeButton.textContent = "Randomize";
    randomizeButton.onclick = randomize;
    controls.appendChild(randomizeButton);

    const setBrush = (b: CellGrid<number>) => {
        brush = b;
        dotBrush.textContent = brush === DOT ? "[Dot]" : "Dot";
        gliderBrush.textContent = brush === GLIDER ? "[Glider]" : "Glider";
        pulsarBrush.textContent = brush === PULSAR ? "[Pulsar]" : "Pulsar";
        eraserBrush.textContent = brush === ERASER ? "[Eraser]" : "Eraser";
    };

    randomize();
    requestAnimationFrame(render);
}

function clear() {
    grid = grid.map(() => 0);
}

function randomize() {
    grid = grid.map(() => Math.round(Math.random()));
}

// function reset() {
//     grid = grid.map(initialValue);
// }

function update() {
    grid = grid.map(conwayRules);
}

function render(currentTime: number) {
    const deltaTime = currentTime - lastUpdateTime;

    if (deltaTime >= frameInterval) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        ctx.fillRect(0, 0, windowWidth, windowHeight);

        ctx.fillStyle = "#333333";
        grid.forEach(({ cell, x, y }) => {
            if (cell === 1) {
                ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
            }
        });

        if (!paused) {
            update();
        }
        lastUpdateTime = currentTime;
    }

    requestAnimationFrame(render);
}

main();
