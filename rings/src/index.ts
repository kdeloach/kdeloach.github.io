const sketch = document.getElementById("sketch");
const canvas = document.createElement("canvas");
if (sketch) {
    sketch.appendChild(canvas);
}

const ctx = canvas.getContext("2d");

let lastUpdateTime = 0;
const frameInterval = 1000 / 120; // FPS

const IN = "IN";
const OUT = "OUT";

let xoff = 0;
let yoff = 0;
let d = 100; // ring diameter
let curve = 0;

let allowOverlap = false;
let speed = 0;
let drawMode = 0;
let redraw = () => {};

class Graph {
    nodes: Map<string, GraphNode>;

    constructor() {
        this.nodes = new Map();
    }

    addNode(cardinal: string, label: string, pos: Position): GraphNode {
        if (this.nodes.has(label)) {
            throw new Error(`node already exists in graph: ${label}`);
        }
        const node = new GraphNode(cardinal, label, pos);
        this.nodes.set(label, node);
        return node;
    }

    addEdge(node1: GraphNode, node2: GraphNode, kind: string): void {
        this.addEdgeWithConstraint(node1, node2, kind, null);
    }

    addEdgeWithConstraint(
        node1: GraphNode,
        node2: GraphNode,
        kind: string,
        constraint: (seen: Map<GraphNode, boolean>) => boolean,
    ): void {
        node1.addEdge(node2, kind, constraint);
        node2.addEdge(node1, kind, constraint);
    }

    exteriorNodes(): GraphNode[] {
        return Array.from(this.nodes.values()).filter((node: GraphNode) => !node.isInteriorNode);
    }

    size(): number {
        return this.nodes.size;
    }
}

interface Position {
    x: number;
    y: number;
}

function positionsEqual(p1: Position, p2: Position, epsilon: number = 1e-6): boolean {
    return Math.abs(p1.x - p2.x) < epsilon && Math.abs(p1.y - p2.y) < epsilon;
}

class GraphNode {
    first: boolean = false;
    pos: Position;
    edges: GraphEdge[];
    isInteriorNode: boolean = false;

    constructor(
        public cardinal: string,
        public label: string,
        public relPos: Position,
    ) {
        this.edges = [];
        this.pos = { x: 0, y: 0 };
    }

    addEdge(node: GraphNode, kind: string, constraint: (seen: Map<GraphNode, boolean>) => boolean): void {
        this.edges.push({ src: this, dst: node, kind, constraint });
    }
}

interface GraphEdge {
    src: GraphNode;
    dst: GraphNode;
    kind: string;
    constraint: (seen: Map<GraphNode, boolean>) => boolean;
}

class Ring {
    pos: Position;

    constructor(
        public T: GraphNode,
        public L: GraphNode,
        public B: GraphNode,
        public R: GraphNode,
        public relPos: Position,
    ) {
        this.pos = { x: 0, y: 0 };
    }
}

const graph = new Graph();
let rings: Ring[] = [];
let currentGame = 0;

function createRing(graph: Graph, label: string, relPos: Position): Ring {
    //    T
    //   /|\
    //  L-+-R
    //   \|/
    //    B

    const T = graph.addNode("T", `${label}-T`, { x: 0, y: -1 });
    const L = graph.addNode("L", `${label}-L`, { x: -1, y: 0 });
    const B = graph.addNode("B", `${label}-B`, { x: 0, y: 1 });
    const R = graph.addNode("R", `${label}-R`, { x: 1, y: 0 });

    const skipIfNodesVisited = (nodes: GraphNode[]) => (seen: Map<GraphNode, boolean>) => {
        if (allowOverlap) {
            return false; // never skip
        }
        return nodes.filter((n: GraphNode) => seen.has(n)).length === nodes.length;
    };

    graph.addEdge(T, L, IN);
    graph.addEdge(T, R, IN);
    graph.addEdge(B, L, IN);
    graph.addEdge(B, R, IN);

    // disable T<->B edge if L and R were visited
    graph.addEdgeWithConstraint(T, B, IN, skipIfNodesVisited([L, R]));
    // disable L<->R edge if T and B were visited
    graph.addEdgeWithConstraint(L, R, IN, skipIfNodesVisited([T, B]));

    return new Ring(T, L, B, R, relPos);
}

function main() {
    // Rings layout:
    // ABC
    // DEF
    const A = createRing(graph, "A", { x: 0, y: 0 });
    const B = createRing(graph, "B", { x: 1, y: 0 });
    const C = createRing(graph, "C", { x: 2, y: 0 });
    const D = createRing(graph, "D", { x: 0, y: 1 });
    const E = createRing(graph, "E", { x: 1, y: 1 });
    const F = createRing(graph, "F", { x: 2, y: 1 });

    rings = [A, B, C, D, E, F];

    A.R.isInteriorNode = true;
    A.B.isInteriorNode = true;
    B.L.isInteriorNode = true;
    B.R.isInteriorNode = true;
    B.B.isInteriorNode = true;
    C.L.isInteriorNode = true;
    C.B.isInteriorNode = true;
    D.T.isInteriorNode = true;
    D.R.isInteriorNode = true;
    E.T.isInteriorNode = true;
    E.L.isInteriorNode = true;
    E.R.isInteriorNode = true;
    F.T.isInteriorNode = true;
    F.L.isInteriorNode = true;

    // Interior edges:
    // A--B--C
    // |  |  |
    // |  |  |
    // D--E--F
    graph.addEdge(A.R, B.L, OUT);
    graph.addEdge(B.R, C.L, OUT);
    graph.addEdge(D.R, E.L, OUT);
    graph.addEdge(E.R, F.L, OUT);
    graph.addEdge(A.B, D.T, OUT);
    graph.addEdge(B.B, E.T, OUT);
    graph.addEdge(C.B, F.T, OUT);

    // Exterior edges:
    // /\ /\ /\ /\
    // \ A  B  C /
    // /         \
    // \         /
    // / D  E  F \
    // \/ \/ \/ \/
    graph.addEdge(A.T, A.L, OUT);
    graph.addEdge(A.L, D.L, OUT);
    graph.addEdge(D.L, D.B, OUT);
    graph.addEdge(D.B, E.B, OUT);
    graph.addEdge(E.B, F.B, OUT);
    graph.addEdge(F.B, F.R, OUT);
    graph.addEdge(F.R, C.R, OUT);
    graph.addEdge(C.R, C.T, OUT);
    graph.addEdge(C.T, B.T, OUT);
    graph.addEdge(B.T, A.T, OUT);

    const overlapCheckbox = document.getElementById("overlap") as HTMLInputElement;
    overlapCheckbox.addEventListener("change", (event: Event) => {
        const checkbox = event.target as HTMLInputElement;
        allowOverlap = checkbox.checked;
        restart();
    });

    const debugCheckbox = document.getElementById("debug") as HTMLInputElement;
    debugCheckbox.addEventListener("change", (event: Event) => {
        const checkbox = event.target as HTMLInputElement;
        drawMode = (drawMode + 1) % 2;
        redraw();
    });

    const restartButton = document.getElementById("restart") as HTMLButtonElement;
    restartButton.addEventListener("click", restart);

    const form = document.getElementById("form") as HTMLFormElement;
    form.addEventListener("change", (event: Event) => {
        const target = event.target as HTMLInputElement;
        if (target.type === "radio" && target.name === "speed") {
            const selectedSpeed = target.value;
            if (selectedSpeed === "Slow") {
                speed = 100;
            } else if (selectedSpeed === "Fast") {
                speed = 20;
            } else if (selectedSpeed === "Instant") {
                speed = 0;
            }
        }
    });

    window.addEventListener("resize", (event: Event) => {
        setDimensions();
        redraw();
    });

    setDimensions();
    restart();
}

function setDimensions() {
    // Define unit widths as percentage of canvas
    const unitD = 1 / 3; // Unit ring width approx 1/3 of canvas
    const unitM = 1 / 10; // Margin width

    // Calculate scale factor to fit 3 rings with margins
    const unitScale = sketch.clientWidth / (unitD * 3 + unitM * 2);

    d = unitD * unitScale;

    const m = unitM * unitScale;
    xoff = d / 2 + m;
    yoff = d / 2 + m;

    curve = d / 3;

    canvas.width = d * 3 + m * 2;
    canvas.height = d * 2 + m * 2;

    updatePositions();
}

async function restart() {
    // Randomize edges for more variety
    graph.nodes.forEach((node) => {
        node.edges = shuffleArray(node.edges);
    });

    const seen = new Map<GraphNode, boolean>();
    const solution: GraphEdge[] = [];

    // Increment currentGame to prevent previous runs from rendering. This is
    // a workaround in place of implementing proper cancellation logic.
    currentGame++;

    // Make a renderer that only draws the current in-progress solution.
    const render = makeRenderFunc(solution, currentGame);
    requestAnimationFrame(render);

    redraw = () => requestAnimationFrame(render);

    const solved = await solve(graph, seen, solution);
    if (!solved) {
        console.error("No solution");
    }
}

function updatePositions() {
    rings.forEach((ring) => {
        const rx = xoff + d * ring.relPos.x;
        const ry = yoff + d * ring.relPos.y;
        ring.pos.x = rx;
        ring.pos.y = ry;

        [ring.T, ring.L, ring.B, ring.R].forEach((node) => {
            const x = rx + (node.relPos.x * d) / 2;
            const y = ry + (node.relPos.y * d) / 2;
            node.pos.x = x;
            node.pos.y = y;
        });
    });
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function solve(graph: Graph, seen: Map<GraphNode, boolean>, solution: GraphEdge[]) {
    const dir = IN;
    const nodes = graph.exteriorNodes();
    const firstNode = nodes[Math.floor(Math.random() * nodes.length)];

    async function findPath(curr: GraphNode, dir: string): Promise<boolean> {
        seen.set(curr, true);

        if (seen.size >= graph.size()) {
            return true;
        }

        if (speed > 0) {
            await sleep(speed);
        }

        for (let edge of curr.edges) {
            if (edge.kind !== dir) {
                continue;
            }
            if (seen.has(edge.dst)) {
                continue;
            }
            if (edge.constraint && edge.constraint(seen)) {
                continue;
            }

            solution.push(edge);

            if (await findPath(edge.dst, dir === IN ? OUT : IN)) {
                return true;
            }

            solution.pop();
        }

        seen.delete(curr);
        return false;
    }

    return await findPath(firstNode, dir);
}

function makeRenderFunc(solution: GraphEdge[], game: number) {
    return function render(currentTime: number) {
        console.log("render");
        const deltaTime = currentTime - lastUpdateTime;

        if (deltaTime >= frameInterval) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawRings();

            if (drawMode === 1) {
                drawDebugEdges();
                drawDebugNodes();
            }

            drawSolution(solution);
            lastUpdateTime = currentTime;
        }

        if (game !== currentGame) {
            return;
        }
        if (solution.length === graph.size() - 1) {
            return;
        }

        requestAnimationFrame(render);
    };
}

function drawRings() {
    ctx.save();
    ctx.strokeStyle = "gray";
    ctx.lineWidth = 5;

    rings.forEach((ring) => {
        ctx.beginPath();
        ctx.arc(ring.pos.x, ring.pos.y, d / 2, 0, Math.PI * 2);
        ctx.stroke();
    });

    ctx.restore();
}

function drawDebugEdges() {
    ctx.save();
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);
    ctx.strokeStyle = "gray";

    graph.nodes.forEach((node) => {
        node.edges.forEach((edge) => {
            drawEdge(node, edge.dst, edge.kind);
        });
    });

    ctx.restore();
}

function drawDebugNodes() {
    graph.nodes.forEach((node) => {
        drawNode(node);
    });
}

function drawNode(node: GraphNode) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(node.pos.x, node.pos.y, 10, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.strokeStyle = "black";
    ctx.stroke();
    ctx.restore();
}

function drawScissors(pos: Position) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.fillStyle = "black";
    ctx.font = "32px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`✂`, pos.x, pos.y);
    ctx.restore();
}

function drawEnd(pos: Position) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = "black";
    ctx.fill();
    ctx.restore();
}

function drawEdge(node1: GraphNode, node2: GraphNode, kind: string) {
    // Skip non-visible edges that only exist to connect 2 rings
    if (positionsEqual(node1.pos, node2.pos)) {
        return;
    }

    const cp1 = { x: node1.pos.x, y: node1.pos.y };
    const cp2 = { x: node2.pos.x, y: node2.pos.y };

    const adjustPoint = (from: string, to: string, cp: Position) => {
        if (kind === IN) {
            // Adjust control points for interior connections towards the
            // center of the ring.
            if (from === "T") {
                cp.y += curve;
            } else if (from === "B") {
                cp.y -= curve;
            } else if (from === "L") {
                cp.x += curve;
            } else if (from === "R") {
                cp.x -= curve;
            }
        } else {
            // Adjust control points for exterior connections away from the
            // rings.
            if (from === "T") {
                cp.y -= curve;
                if (to === "L") {
                    cp.x -= curve;
                } else if (to === "R") {
                    cp.x += curve;
                }
            } else if (from === "B") {
                cp.y += curve;
                if (to === "L") {
                    cp.x -= curve;
                } else if (to === "R") {
                    cp.x += curve;
                }
            } else if (from === "L") {
                cp.x -= curve;
                if (to === "T") {
                    cp.y -= curve;
                } else if (to === "B") {
                    cp.y += curve;
                }
            } else if (from === "R") {
                cp.x += curve;
                if (to === "T") {
                    cp.y -= curve;
                } else if (to === "B") {
                    cp.y += curve;
                }
            }
        }
    };

    adjustPoint(node1.cardinal, node2.cardinal, cp1);
    adjustPoint(node2.cardinal, node1.cardinal, cp2);

    ctx.beginPath();
    ctx.moveTo(node1.pos.x, node1.pos.y);
    ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, node2.pos.x, node2.pos.y);
    ctx.stroke();
}

function drawSolution(solution: GraphEdge[]) {
    if (solution.length === 0) {
        return;
    }

    ctx.save();

    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.strokeStyle = "black";

    for (let i = 0; i < solution.length; i++) {
        if (drawMode === 1) {
            switch (i % 3) {
                case 0:
                    ctx.strokeStyle = "red";
                    break;
                case 1:
                    ctx.strokeStyle = "blue";
                    break;
                case 2:
                    ctx.strokeStyle = "green";
                    break;
            }
        }

        const edge = solution[i];
        const node1 = edge.src;
        const node2 = edge.dst;
        drawEdge(node1, node2, edge.kind);
    }

    ctx.restore();

    const firstNode = solution[0].src;
    const lastNode = solution[solution.length - 1].dst;
    drawScissors(firstNode.pos);
    drawEnd(lastNode.pos);
}

function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

main();
