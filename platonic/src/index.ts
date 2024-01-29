const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d");

const base5NumsEl = document.getElementById("base5Label");
const base10NumsEl = document.getElementById("base10Label");
const base10NumsInput = document.getElementById("base10Input") as HTMLInputElement;
const drawDigitsCheckbox = document.getElementById("drawDigitsCheckbox") as HTMLInputElement;

const COLS = 5;
const ROWS = 5;

const SHAPE_RADIUS = 40;
const SHAPE_RADIUS_HALF = SHAPE_RADIUS / 2;
const SHAPE_BORDER = 4;
const SHAPE_MARGIN = 5;

const MARGIN = 20;
const WIDTH = (SHAPE_RADIUS + SHAPE_MARGIN * 2) * COLS + MARGIN * 2;
const HEIGHT = (SHAPE_RADIUS + SHAPE_MARGIN * 2) * ROWS + MARGIN * 2;
const BG_COLOR = "#ccc";
const FG_COLOR = "#333";

canvas.width = WIDTH;
canvas.height = HEIGHT;

type Position = {
    col: number;
    row: number;
};

type XY = {
    x: number;
    y: number;
};

function posToXY(pos: Position): XY {
    const x = (SHAPE_RADIUS + SHAPE_MARGIN * 2) * pos.col + (SHAPE_RADIUS_HALF + SHAPE_MARGIN) + MARGIN;
    const y = (SHAPE_RADIUS + SHAPE_MARGIN * 2) * pos.row + (SHAPE_RADIUS_HALF + SHAPE_MARGIN) + MARGIN;
    return { x, y };
}

function xyToPos(coord: XY): Position {
    let col = Math.floor((coord.x - MARGIN) / (SHAPE_RADIUS + SHAPE_MARGIN * 2));
    let row = Math.floor((coord.y - MARGIN) / (SHAPE_RADIUS + SHAPE_MARGIN * 2));
    // clamp col
    if (col < 0) {
        col = 0;
    } else if (col >= COLS) {
        col = COLS - 1;
    }
    // clamp row
    if (row < 0) {
        row = 0;
    } else if (row >= ROWS) {
        row = ROWS - 1;
    }
    return { col, row };
}

function drawFrame() {
    const frameWidth = 10;
    const margin = frameWidth / 2 + 1;
    const frameX = margin;
    const frameY = margin;
    const frameWidthWithMargin = canvas.width - margin * 2;
    const frameHeightWithMargin = canvas.height - margin * 2;

    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(frameX, frameY, frameWidthWithMargin, frameHeightWithMargin);

    ctx.lineWidth = frameWidth;
    ctx.strokeStyle = FG_COLOR;
    ctx.lineJoin = "round";
    ctx.strokeRect(frameX, frameY, frameWidthWithMargin, frameHeightWithMargin);
}

function drawSquare(pos: Position, color: string = FG_COLOR) {
    let { x, y } = posToXY(pos);
    ctx.strokeStyle = color;
    ctx.lineWidth = SHAPE_BORDER;
    ctx.beginPath();
    ctx.rect(x - SHAPE_RADIUS_HALF, y - SHAPE_RADIUS_HALF, SHAPE_RADIUS, SHAPE_RADIUS);
    ctx.closePath();
    ctx.stroke();
}

function drawCircle(pos: Position, color: string = FG_COLOR) {
    let { x, y } = posToXY(pos);
    ctx.strokeStyle = color;
    ctx.lineWidth = SHAPE_BORDER;
    ctx.beginPath();
    ctx.arc(x, y, SHAPE_RADIUS_HALF, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.stroke();
}

function drawTriangle(pos: Position, color: string = FG_COLOR) {
    let { x, y } = posToXY(pos);
    ctx.strokeStyle = color;
    ctx.lineWidth = SHAPE_BORDER;
    ctx.beginPath();
    ctx.moveTo(x, y - SHAPE_RADIUS_HALF);
    ctx.lineTo(x - SHAPE_RADIUS_HALF, y + SHAPE_RADIUS_HALF);
    ctx.lineTo(x + SHAPE_RADIUS_HALF, y + SHAPE_RADIUS_HALF);
    ctx.closePath();
    ctx.stroke();
}

function drawDiamond(pos: Position, color: string = FG_COLOR) {
    drawRegularPolygon(pos, 4, 0, color);
}

function drawPentagon(pos: Position, color: string = FG_COLOR) {
    // rotate -18 degrees
    drawRegularPolygon(pos, 5, -Math.PI / 10, color);
}

function drawHexagon(pos: Position, color: string = FG_COLOR) {
    // rotate -90 degrees
    drawRegularPolygon(pos, 6, -Math.PI / 2, color);
}

function drawRegularPolygon(pos: Position, sides: number, rotation: number = 0, color: string = FG_COLOR) {
    if (sides < 3) {
        throw new Error("A polygon must have at least 3 sides.");
    }
    let { x, y } = posToXY(pos);
    ctx.strokeStyle = color;
    ctx.lineWidth = SHAPE_BORDER;
    ctx.beginPath();
    const angle = (Math.PI * 2) / sides;
    ctx.moveTo(x + SHAPE_RADIUS_HALF * Math.cos(rotation), y + SHAPE_RADIUS_HALF * Math.sin(rotation));

    for (let i = 0; i < sides; i++) {
        const nextX = x + SHAPE_RADIUS_HALF * Math.cos(i * angle + rotation);
        const nextY = y + SHAPE_RADIUS_HALF * Math.sin(i * angle + rotation);
        ctx.lineTo(nextX, nextY);
    }

    ctx.closePath();
    ctx.stroke();
}

interface TextOpts {
    fontSize: number;
    fontFamily: string;
    color: string;
    textAlign: CanvasTextAlign;
    textBaseline: CanvasTextBaseline;
    offsetY: number;
}

const defaultTextOpts: TextOpts = {
    fontSize: 18,
    fontFamily: "Arial",
    color: FG_COLOR,
    textAlign: "center",
    textBaseline: "middle",
    offsetY: 0,
};

function drawText(pos: Position, text: string, opts: TextOpts = defaultTextOpts) {
    let { x, y } = posToXY(pos);
    ctx.font = `${opts.fontSize}px ${opts.fontFamily}`;
    ctx.fillStyle = opts.color;
    ctx.textAlign = opts.textAlign;
    ctx.textBaseline = opts.textBaseline;
    ctx.fillText(text, x, y + 1 + opts.offsetY);
}

interface ShapeNode {
    shapeIndex: number;
    pos: Position;
}

type ShapeFunc = (pos: Position, color: string) => void;

function shapeFunc(index: number): ShapeFunc {
    switch (index) {
        case 0:
            return drawTriangle;
        case 1:
            return drawSquare;
        case 2:
            return drawDiamond;
        case 3:
            return drawPentagon;
        case 4:
            return drawHexagon;
    }
    throw new Error("invalid shape index: " + index);
}

// Return "wrap around" distance between shapes.
function shapeDistance(prevIndex: number, index: number): number {
    let dist = index - prevIndex;
    if (dist < 0) {
        dist += 5;
    }
    return dist;
}

const circle: ShapeNode = { pos: { col: 0, row: ROWS - 1 }, shapeIndex: -1 };
const firstShape: ShapeNode = { pos: { ...circle.pos, col: 1 }, shapeIndex: 0 };

const ghosts: ShapeNode[] = [];
let chain: ShapeNode[] = [circle, firstShape];

interface Value {
    base5Nums: number[];
    base10Nums: number[];
}

function getValue(): number[] {
    let prev = firstShape;
    const base5Nums: number[] = [];
    for (let i = 2, j = -1; i < chain.length; i++) {
        const node = chain[i];
        const base5Digit = shapeDistance(prev.shapeIndex, node.shapeIndex);

        if (node.pos.col != prev.pos.col) {
            j++;
            base5Nums[j] = 0;
        }

        base5Nums[j] *= 10;
        base5Nums[j] += base5Digit;
        prev = node;
    }
    return base5Nums;
}

function setValue(base10Nums: number[]) {
    reset();
    let prevShape = firstShape;

    for (let i = 0; i < base10Nums.length; i++) {
        const base10Num = base10Nums[i];
        let base5Num = decimalToBase5(base10Num);

        // Clamp
        const maxNumBase5 = getMaxNumBase5(prevShape.pos.row + 1);
        if (base5Num > maxNumBase5) {
            base5Num = maxNumBase5;
        }

        const base5Str = `${base5Num}`;

        for (let j = 0; j < base5Str.length; j++) {
            const base5Digit = parseInt(base5Str[j], 10);
            const shapeIndex = (prevShape.shapeIndex + base5Digit) % 5;

            let pos = j == 0 ? { col: prevShape.pos.col + 1, row: prevShape.pos.row } : { col: prevShape.pos.col, row: prevShape.pos.row - 1 };

            prevShape = pushNode({ shapeIndex, pos });
        }
    }
}

function getMaxNumBase5(numLen: number): number {
    let max = 0;
    for (let i = 0; i < numLen; i++) {
        max = max * 10 + 4;
    }
    return max;
}

function decimalToBase5(decimalNumber: number): number {
    let result = 0;
    let base = 1;

    while (decimalNumber > 0) {
        result += (decimalNumber % 5) * base;
        decimalNumber = Math.floor(decimalNumber / 5);
        base *= 10;
    }

    return result;
}

function base5ToDecimal(base5Number: number): number {
    let result = 0;
    let base = 1;

    while (base5Number > 0) {
        result += (base5Number % 10) * base;
        base5Number = Math.floor(base5Number / 10);
        base *= 5;
    }

    return result;
}

function draw() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    drawFrame();
    drawCircle(circle.pos, "#fff");

    let prev: ShapeNode = firstShape;

    for (let i = 1; i < chain.length; i++) {
        const node = chain[i];
        const drawFn = shapeFunc(node.shapeIndex);
        const color = node === firstShape ? "#555" : FG_COLOR;
        drawFn(node.pos, color);

        if (drawDigitsCheckbox.checked) {
            const base5Digit = shapeDistance(prev.shapeIndex, node.shapeIndex);
            const offsetY = node.shapeIndex == 0 ? 5 : 0;
            drawText(node.pos, `${base5Digit}`, { ...defaultTextOpts, offsetY });
        }

        prev = node;
    }

    for (let i = 0; i < ghosts.length; i++) {
        const ghost = ghosts[i];
        const drawFn = shapeFunc(ghost.shapeIndex);
        drawFn(ghost.pos, "#ddd");
    }
}

function findShape(nodes: ShapeNode[], { row, col }: Position): ShapeNode | false {
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (node.pos.col == col && node.pos.row == row) {
            return node;
        }
    }
    return false;
}

function nextShape(node: ShapeNode) {
    node.shapeIndex = (node.shapeIndex + 1) % 5;
}

function prevShape(node: ShapeNode) {
    if (node.shapeIndex - 1 < 0) {
        node.shapeIndex = 4;
    } else {
        node.shapeIndex = (node.shapeIndex - 1) % 5;
    }
}

function pushNode(node: ShapeNode): ShapeNode {
    chain.push(node);
    return node;
}

function popNode() {
    if (chain.length > 2) {
        chain.pop();
    }
}

function reset() {
    chain = chain.slice(0, 2);
}

interface UpdateOpts {
    updateInput: boolean;
}

function update(opts: UpdateOpts) {
    updateGhosts();

    const base5Nums = getValue();
    base5NumsEl.innerText = base5Nums.join(" ");

    if (opts.updateInput) {
        const base10Nums = base5Nums.map((n) => base5ToDecimal(n));
        base10NumsInput.value = base10Nums.join(" ");
    }
}

function updateGhosts() {
    ghosts.pop();
    ghosts.pop();
    const prev = chain[chain.length - 1];
    // Horizontal ghost
    if (prev.pos.col + 1 < COLS) {
        ghosts.push({ shapeIndex: prev.shapeIndex, pos: { ...prev.pos, col: prev.pos.col + 1 } });
    }
    // Vertical ghost
    if (prev !== firstShape && prev.pos.row - 1 >= 0) {
        ghosts.push({ shapeIndex: prev.shapeIndex, pos: { ...prev.pos, row: prev.pos.row - 1 } });
    }
}

// Disable text selection on double click
canvas.addEventListener("mousedown", (event) => {
    event.preventDefault();
});

canvas.addEventListener("click", (event) => {
    const x = event.clientX - canvas.getBoundingClientRect().left;
    const y = event.clientY - canvas.getBoundingClientRect().top;
    const pos = xyToPos({ x, y });

    const node = findShape(chain, pos);
    if (node !== false) {
        if (node === circle) {
            popNode();
        } else if (event.shiftKey) {
            prevShape(node);
        } else {
            nextShape(node);
        }
        update({ updateInput: true });
        draw();
        return;
    }

    const ghost = findShape(ghosts, pos);
    if (ghost !== false) {
        pushNode(ghost);
        update({ updateInput: true });
        draw();
    }
});

function handleKeyupEvent(event: KeyboardEvent) {
    const input = (event.target as HTMLInputElement).value;
    const matches: string[] = Array.from(input.matchAll(/\d+/g)).map((m) => m[0]);
    let nums: number[] = matches.map((str) => parseInt(str, 10)).filter((n) => !isNaN(n));
    nums = nums.slice(0, COLS - 2);
    setValue(nums);
    update({ updateInput: false });
    draw();
}

const debouncedKeyupEvent = (() => {
    let timeoutId: number;

    return function (event: KeyboardEvent) {
        clearTimeout(timeoutId);

        // Debounce only for Backspace & Delete keys
        if (event.key === "Backspace" || event.key === "Delete") {
            timeoutId = window.setTimeout(() => {
                handleKeyupEvent(event);
            }, 250);
        } else {
            handleKeyupEvent(event);
        }
    };
})();

base10NumsInput.addEventListener("keyup", debouncedKeyupEvent);

drawDigitsCheckbox.addEventListener("click", (event) => {
    draw();
});

function randomize() {
    const nums: number[] = [];
    for (let i = 0; i < COLS - 2; i++) {
        const n = Math.floor(Math.random() * 25);
        nums.push(n);
    }
    setValue(nums);
}

randomize();
update({ updateInput: true });
draw();
