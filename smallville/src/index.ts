const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");

const sketch = document.getElementById("sketch");
sketch.appendChild(canvas);

const maxVel = 100;
const circleRadius = 110; // radius of initial position circle
const personRadius = 40; // size of orb
const font = "16px Arial";

let width = sketch.clientWidth;
let height = width * (9 / 16);

let lastUpdateTime = 0;
const frameInterval = 1000 / 120; // FPS

class Color {
    public rgb: string;
    public rgba: string;

    constructor(r: number, g: number, b: number) {
        this.rgb = `rgb(${r}, ${g}, ${b})`;
        this.rgba = `rgba(${r}, ${g}, ${b}, 0.5)`;
    }
}

const black = new Color(0, 0, 0);
const white = new Color(255, 255, 255);

interface Vector {
    x: number;
    y: number;
}

class Person {
    public pos: Vector;
    public vel: Vector;
    public bg: Color;
    public fg: Color;
    public attraction: Map<Person, number>;

    constructor(
        public name: string,
        bg: string,
    ) {
        this.pos = { x: 0, y: 0 };
        this.vel = { x: 0, y: 0 };
        this.bg = parseHex(bg);
        this.fg = white;
        this.attraction = new Map();
    }

    update() {
        for (let [p2, amount] of this.attraction) {
            this.attract(p2.pos, amount);
        }
        // Gravitate towards center to keep everything visible
        this.attract(center, 0.1);
    }

    attract(pos: Vector, amount: number) {
        const delta = {
            x: pos.x - this.pos.x,
            y: pos.y - this.pos.y,
        };
        const distance = Math.sqrt(delta.x * delta.x + delta.y * delta.y);
        const angle = Math.atan2(delta.y, delta.x);

        const scale = 1 / distance;
        const speed = amount * scale * 6;

        this.vel.x += Math.cos(angle) * speed;
        this.vel.y += Math.sin(angle) * speed;
    }

    loves(...people: Person[]) {
        this.setAttraction(1.5, ...people);
    }
    hates(...people: Person[]) {
        this.setAttraction(-0.4, ...people);
    }
    family(...people: Person[]) {
        this.setAttraction(0.4, ...people);
    }
    likes(...people: Person[]) {
        this.setAttraction(0.2, ...people);
    }
    setAttraction(amount: number, ...people: Person[]) {
        for (let p2 of people) {
            this.attraction.set(p2, amount);
        }
    }
}

let people: Person[] = [];
let center: Vector;
let paused = false;
let shouldClear = false;
let debug = 0;

function main() {
    canvas.addEventListener("click", () => {
        blast();
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "p") {
            paused = !paused;
        }
        if (event.key === "c") {
            shouldClear = !shouldClear;
        }
        if (event.key === "r") {
            shufflePeople();
            resetPosition();
            updatePeople();
            initTransform();
            ctx.clearRect(0, 0, width, height);
        }
        if (event.key === "d") {
            debug++;
        }
    });

    window.addEventListener("resize", (event: Event) => {
        setDimensions();
        // on resize... go back to "starting" position instead of random
        // resetPosition();
    });

    setDimensions();

    createPeople();
    shufflePeople();
    resetPosition();
    updatePeople();
    initTransform();

    requestAnimationFrame(update);
}

function setDimensions() {
    width = sketch.clientWidth;
    height = width * (9 / 16); // 16:9 aspect ratio
    center = { x: width / 2, y: height / 2 };
    canvas.width = width;
    canvas.height = height;
}

function createPeople() {
    const clark = new Person("Clark", "#4FA3F7"); // vibrant blue
    const lex = new Person("Lex", "#A020F0"); // vivid purple (Lex’s signature)
    const lana = new Person("Lana", "#FF6FB7"); // hot pink
    const lois = new Person("Lois", "#FFD447"); // bright yellow
    const chloe = new Person("Chloe", "#FFB347"); // vivid orange-gold
    const pete = new Person("Pete", "#00C853"); // vivid green
    const jimmy = new Person("Jimmy", "#FF7043"); // bright coral orange
    const oliver = new Person("Oliver", "#228B22"); // forest green (Green Arrow)
    const martha = new Person("Martha", "#FF4D4D"); // bright red
    const jonathan = new Person("Jonathan", "#C57B57"); // warm copper
    const lionel = new Person("Lionel", "#4B4B4B"); // dark gray

    clark.family(martha, jonathan);
    clark.loves(lois, lana);
    clark.likes(oliver, pete, jimmy, chloe);

    lex.family(lionel);
    lex.loves(lana);
    lex.hates(clark, lionel);

    lana.loves(clark);
    lana.likes(chloe, pete);
    lana.hates(lex);

    lois.family(chloe);
    lois.loves(clark);
    lois.likes(oliver, jimmy);

    chloe.family(lois);
    chloe.loves(jimmy, oliver);
    chloe.likes(clark, pete, lana);

    pete.loves(chloe);
    pete.likes(clark);
    pete.hates(lex, lionel);

    jimmy.loves(chloe);
    jimmy.likes(clark, lois);

    oliver.loves(chloe);
    oliver.likes(clark, lois);
    oliver.hates(lex);

    martha.family(clark, jonathan);
    martha.loves(jonathan);
    martha.likes(lois, lana, chloe, pete);

    jonathan.family(clark, martha);
    jonathan.loves(martha);
    jonathan.likes(lois, lana, chloe, pete);
    jonathan.hates(lex, lionel);

    lionel.family(lex);
    lionel.loves(martha);

    people = [clark, lex, lana, lois, chloe, pete, jimmy, oliver, martha, jonathan, lionel];
}

function shufflePeople() {
    people = shuffleArray(people);
}

function resetPosition() {
    // Assign start position (should be random per person)
    for (let i = 0; i < people.length; i++) {
        const theta = (2 * Math.PI * i) / people.length;
        people[i].pos.x = Math.cos(theta) * circleRadius + center.x;
        people[i].pos.y = Math.sin(theta) * circleRadius + center.y;
        people[i].vel.x = 0;
        people[i].vel.y = 0;
    }
}

function blast() {
    // TODO: translate center coords by current transform
    for (let i = 0; i < people.length; i++) {
        const angle = Math.atan2(people[i].pos.y - center.y, people[i].pos.x - center.x);
        people[i].vel.x += Math.cos(angle) * 5;
        people[i].vel.y += Math.sin(angle) * 5;
    }
}

function updatePeople() {
    // Reduce velocity each frame to prevent orbs getting flung out too far
    for (let i = 0; i < people.length; i++) {
        const p1 = people[i];
        p1.vel.x *= 0.99;
        p1.vel.y *= 0.99;
    }

    for (let i = 0; i < people.length; i++) {
        people[i].update();
    }

    for (let i = 0; i < people.length; i++) {
        people[i].pos.x += Math.min(maxVel, people[i].vel.x);
        people[i].pos.y += Math.min(maxVel, people[i].vel.y);
    }

    // Collision detection and avoidance
    let collision = true;
    let rounds = 100;

    while (collision && rounds > 0) {
        collision = false;
        for (let i = 0; i < people.length; i++) {
            for (let j = 0; j < people.length; j++) {
                if (i !== j) {
                    const p1 = people[i];
                    const p2 = people[j];
                    const delta = {
                        x: p2.pos.x - p1.pos.x,
                        y: p2.pos.y - p1.pos.y,
                    };
                    const distance = Math.sqrt(delta.x * delta.x + delta.y * delta.y);

                    if (distance < personRadius * 2) {
                        collision = true;

                        const angle = Math.atan2(delta.y, delta.x);
                        const overlap = personRadius * 2 - distance;
                        const dx = Math.cos(angle) * overlap * 0.7;
                        const dy = Math.sin(angle) * overlap * 0.7;

                        p1.pos.x -= dx;
                        p1.pos.y -= dy;
                        p2.pos.x += dx;
                        p2.pos.y += dy;
                    }
                }
            }
        }
        if (collision) {
            rounds--;
        }
    }
}

// Set transform based on content bounds (no interpolation).
function initTransform() {
    const bounds = getContentBounds();

    // Calculate scale to fit canvas
    const scaleX = width / bounds.width;
    const scaleY = height / bounds.height;
    const scale = Math.min(scaleX, scaleY);

    // Calculate centering offset
    const scaledWidth = bounds.width * scale;
    const scaledHeight = bounds.height * scale;
    const offsetX = (width - scaledWidth) / 2;
    const offsetY = (height - scaledHeight) / 2;

    transform = {
        scale,
        offsetX,
        offsetY,
        boundsX: bounds.x,
        boundsY: bounds.y,
    };
}

// Interpolate transform based on content bounds.
function updateTransform() {
    const bounds = getContentBounds();

    // Calculate scale to fit canvas
    const scaleX = width / bounds.width;
    const scaleY = height / bounds.height;
    const scale = Math.min(scaleX, scaleY);

    // Calculate centering offset
    const scaledWidth = bounds.width * scale;
    const scaledHeight = bounds.height * scale;
    const offsetX = (width - scaledWidth) / 2;
    const offsetY = (height - scaledHeight) / 2;

    // Interpolate transform values for smooth camera transition
    transform.scale = linear(transform.scale, scale);
    transform.offsetX = linear(transform.offsetX, offsetX);
    transform.offsetY = linear(transform.offsetY, offsetY);
    transform.boundsX = linear(transform.boundsX, bounds.x);
    transform.boundsY = linear(transform.boundsY, bounds.y);
}

function parseHex(s: string): Color {
    s = s.slice(1); // Strip "#"
    const r = parseInt(s.slice(0, 2), 16) / 255;
    const g = parseInt(s.slice(2, 4), 16) / 255;
    const b = parseInt(s.slice(4, 6), 16) / 255;
    return new Color(r * 255, g * 255, b * 255);
}

interface Transform {
    scale: number;
    boundsX: number;
    boundsY: number;
    offsetX: number;
    offsetY: number;
}

var transform: Transform;

function linear(a: number, b: number): number {
    return a + (b - a) * 0.1;
}

function applyTransform(t: Transform, ctx: CanvasRenderingContext2D) {
    // Apply transform: translate to center, scale, then translate to bounds origin
    ctx.translate(t.offsetX, t.offsetY);
    ctx.scale(t.scale, t.scale);
    ctx.translate(-t.boundsX, -t.boundsY);
}

function update(currentTime: number) {
    const deltaTime = currentTime - lastUpdateTime;
    if (deltaTime >= frameInterval && !paused) {
        updatePeople();
        updateTransform();
        render();
        lastUpdateTime = currentTime;
    }
    requestAnimationFrame(update);
}

function render() {
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset
    if (shouldClear) {
        ctx.clearRect(0, 0, width, height);
    }
    applyTransform(transform, ctx);

    const drawLove = debug % 4 === 1;
    const drawHate = debug % 4 === 2;
    const drawBoth = debug % 4 === 3;

    if (drawLove || drawHate || drawBoth) {
        // Draw connecting lines
        for (let i = 0; i < people.length; i++) {
            const p1 = people[i];
            for (let j = 0; j < people.length; j++) {
                if (i === j) {
                    continue;
                }
                const p2 = people[j];
                const attraction = p1.attraction.get(p2);
                if (!attraction) {
                    continue;
                } else if (drawLove && attraction < 0) {
                    continue;
                } else if (drawHate && attraction > 0) {
                    continue;
                }
                ctx.strokeStyle = p1.bg.rgba;
                ctx.lineWidth = 5 * Math.abs(attraction);
                ctx.beginPath();
                ctx.moveTo(p1.pos.x, p1.pos.y);
                ctx.lineTo(p2.pos.x, p2.pos.y);
                ctx.stroke();
            }
        }
    }

    // Draw orbs
    for (let i = 0; i < people.length; i++) {
        const person = people[i];
        ctx.fillStyle = person.bg.rgb;
        ctx.beginPath();
        ctx.arc(person.pos.x, person.pos.y, personRadius, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw names
    for (let i = 0; i < people.length; i++) {
        const person = people[i];
        ctx.fillStyle = person.fg.rgb;
        ctx.font = font;
        ctx.fillText(person.name, person.pos.x - ctx.measureText(person.name).width / 2, person.pos.y + 3);
    }
}

interface Bounds {
    x: number;
    y: number;
    width: number;
    height: number;
}

function getContentBounds(): Bounds {
    let minX = Infinity,
        maxX = -Infinity,
        minY = Infinity,
        maxY = -Infinity;
    for (let i = 0; i < people.length; i++) {
        const person = people[i];
        minX = Math.min(minX, person.pos.x);
        maxX = Math.max(maxX, person.pos.x);
        minY = Math.min(minY, person.pos.y);
        maxY = Math.max(maxY, person.pos.y);
    }
    return { x: minX - personRadius, y: minY - personRadius, width: maxX - minX + personRadius * 2, height: maxY - minY + personRadius * 2 };
}

function shuffleArray<T>(array: T[]): T[] {
    const shuffledArray = [...array]; // Create a shallow copy of the original array

    for (let i = shuffledArray.length - 1; i > 0; i--) {
        // Generate a random index between 0 and i (inclusive)
        const randomIndex = Math.floor(Math.random() * (i + 1));

        // Swap elements at randomIndex and i
        [shuffledArray[i], shuffledArray[randomIndex]] = [shuffledArray[randomIndex], shuffledArray[i]];
    }

    return shuffledArray;
}

main();

// Fixes TS2451: Cannot redeclare block-scoped variable
export {};
