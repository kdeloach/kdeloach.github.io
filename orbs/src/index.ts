const canvas = document.createElement("canvas");
const el = document.getElementById("sketch");
el.appendChild(canvas);

let canvasRect: { top: number; left: number };

const context = canvas.getContext("2d");

const maxVel = 100;

let windowWidth = el.clientWidth;
let windowHeight = windowWidth * (9 / 16);
let circleRadius = 110; // radius of initial position circle
let personRadius = 40; // size of orb

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

const black = parseHex("000000");
const white = parseHex("FFFFFF");

const bgColors = [
    parseHex("FF0000"),
    parseHex("BE0AFF"),
    parseHex("FF8700"),
    parseHex("FFD300"),
    parseHex("DEFF0A"),
    parseHex("A1FF0A"),
    parseHex("0AFF99"),
    parseHex("0AEFFF"),
    parseHex("147DF5"),
    parseHex("580AFF"),
];

const fgColors = [white, white, black, black, black, black, black, black, white, white];

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

    constructor(public name: string) {
        this.pos = { x: 0, y: 0 };
        this.vel = { x: 0, y: 0 };
        this.bg = white;
        this.fg = black;
        this.attraction = new Map();
    }

    loves(...people: Person[]) {
        this.attract(1, ...people);
    }
    family(...people: Person[]) {
        // this.attract(0.2, ...people);
    }
    likes(...people: Person[]) {
        // this.attract(0.1, ...people);
    }
    dislikes(...people: Person[]) {
        // this.attract(-0.1, ...people);
    }
    hates(...people: Person[]) {
        this.attract(-0.8, ...people);
    }
    attract(amount: number, ...people: Person[]) {
        for (let p2 of people) {
            this.attraction.set(p2, amount);
        }
    }
}

const MOUSE = "MOUSE";

let people: Person[] = [];
let mousePos: Vector;
let paused = false;
let debug = 0;

function main() {
    createPeople();
    shufflePeople();
    setDimensions();
    resetPosition();

    // canvas.addEventListener("mousemove", (event) => {
    //     mousePos.x = event.clientX - canvasRect.left;
    //     mousePos.y = event.clientY - canvasRect.top;
    // });

    // canvas.addEventListener("click", () => {
    //     blast();
    // });

    document.addEventListener("keydown", (event) => {
        if (event.key === "p") {
            paused = !paused;
        }
        if (event.key === "r") {
            shufflePeople();
            resetPosition();
        }
        if (event.key === "d") {
            debug++;
        }
    });

    window.addEventListener("resize", (event: Event) => {
        setDimensions();
        // on resize... go back to "starting" position instead of random
        resetPosition();
    });

    requestAnimationFrame(render);
}

function setDimensions() {
    windowWidth = el.clientWidth;
    windowHeight = windowWidth * (9 / 16);

    mousePos = { x: windowWidth / 2, y: windowHeight / 2 };

    canvas.width = windowWidth;
    canvas.height = windowHeight;
    canvasRect = canvas.getBoundingClientRect();

    circleRadius = windowWidth * (20 / 100);
    personRadius = windowWidth * (6 / 100);
}

function createPeople() {
    const clark = new Person("Clark");
    const lex = new Person("Lex");
    const lana = new Person("Lana");
    const lois = new Person("Lois");
    const chloe = new Person("Chloe");
    const pete = new Person("Pete");
    const jimmy = new Person("Jimmy");
    const oliver = new Person("Oliver");
    const martha = new Person("Martha");
    const jonathan = new Person("Jonathan");
    const lionel = new Person("Lionel");

    clark.loves(lois);
    clark.family(martha, jonathan);
    clark.likes(oliver, pete, jimmy, chloe, lana);

    lex.loves(lana);
    lex.hates(clark, lionel);

    lana.loves(clark);
    lana.likes(chloe);
    lana.hates(lex);

    lois.loves(clark);
    lois.family(chloe);
    lois.likes(oliver, jimmy);

    chloe.loves(jimmy, oliver);
    chloe.family(lois);
    chloe.likes(clark, pete);

    pete.loves(chloe);
    pete.likes(clark);
    pete.hates(lex, lionel);

    jimmy.loves(chloe);
    jimmy.likes(clark, lois);

    oliver.loves(chloe);
    oliver.likes(clark, lois);
    oliver.hates(lex);

    martha.loves(jonathan);
    martha.family(clark);
    martha.likes(lois, lana, chloe, pete);

    jonathan.loves(martha);
    jonathan.family(clark);
    jonathan.likes(lois, lana, chloe, pete);
    jonathan.hates(lex, lionel);

    lionel.loves(martha);
    lionel.family(lex);

    // Assign colors (should always be the same per person)
    people = [clark, lex, lana, lois, chloe, pete, jimmy, oliver, martha, jonathan];
    // people = [clark, lex, lana, lois, chloe, pete, jimmy, oliver, martha, jonathan, lionel];
    for (let i = 0; i < people.length; i++) {
        people[i].bg = bgColors[i % bgColors.length];
        people[i].fg = fgColors[i % fgColors.length];
    }
}

function shufflePeople() {
    people = shuffleArray(people);
}

function resetPosition() {
    // Assign start position (should be random per person)
    for (let i = 0; i < people.length; i++) {
        const theta = (2 * Math.PI * i) / people.length;
        people[i].pos.x = Math.cos(theta) * circleRadius + mousePos.x;
        people[i].pos.y = Math.sin(theta) * circleRadius + mousePos.y;
        people[i].vel.x = 0;
        people[i].vel.y = 0;
    }
}

function blast() {
    for (let i = 0; i < people.length; i++) {
        const angle = Math.atan2(people[i].pos.y - mousePos.y, people[i].pos.x - mousePos.x);
        people[i].vel.x += Math.cos(angle) * 5;
        people[i].vel.y += Math.sin(angle) * 5;
    }
}

function updatePeople() {
    for (let i = 0; i < people.length; i++) {
        const p1 = people[i];
        p1.vel.x *= 0.98;
        p1.vel.y *= 0.98;
    }

    // Prevent orbs from drifting too far away from origin
    for (let i = 0; i < people.length; i++) {
        const p1 = people[i];
        const delta = {
            x: mousePos.x - p1.pos.x,
            y: mousePos.y - p1.pos.y,
        };
        const distance = Math.sqrt(delta.x * delta.x + delta.y * delta.y);
        const angle = Math.atan2(delta.y, delta.x);
        // if (distance <= personRadius * 2) {
        //     continue;
        // }
        const speed = distance / (windowWidth * 10);
        p1.vel.x += Math.cos(angle) * speed;
        p1.vel.y += Math.sin(angle) * speed;
    }

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
                const angle = Math.atan2(delta.y, delta.x);

                // if (distance <= personRadius * 2) {
                //     continue;
                // }

                const attraction = p1.attraction.get(p2);
                if (isNaN(attraction)) {
                    continue;
                }

                const scale = 1 / distance;
                const speed = attraction * scale * (personRadius / 4);

                p1.vel.x += Math.cos(angle) * speed;
                p1.vel.y += Math.sin(angle) * speed;
            }
        }
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
                        rounds--;

                        const angle = Math.atan2(delta.y, delta.x);
                        const overlap = personRadius * 2 - distance;
                        const dx = Math.cos(angle) * overlap * 0.2;
                        const dy = Math.sin(angle) * overlap * 0.2;

                        p1.pos.x -= dx;
                        p1.pos.y -= dy;
                        p2.pos.x += dx;
                        p2.pos.y += dy;
                    }
                }
            }
        }
    }
}

function parseHex(s: string): Color {
    const r = parseInt(s.slice(0, 2), 16) / 255;
    const g = parseInt(s.slice(2, 4), 16) / 255;
    const b = parseInt(s.slice(4, 6), 16) / 255;
    return new Color(r * 255, g * 255, b * 255);
}

function render(currentTime: number) {
    const deltaTime = currentTime - lastUpdateTime;

    let font = "16px Arial";
    if (windowWidth <= 300) {
        font = "10px Arial";
    } else if (windowWidth <= 500) {
        font = "12px Arial";
    }

    if (deltaTime >= frameInterval) {
        context.clearRect(0, 0, windowWidth, windowHeight);

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
                    context.strokeStyle = p1.bg.rgba;
                    context.lineWidth = 5 * Math.abs(attraction);
                    context.beginPath();
                    context.moveTo(p1.pos.x, p1.pos.y);
                    context.lineTo(p2.pos.x, p2.pos.y);
                    context.stroke();
                }
            }
        }

        // Draw orbs
        for (let i = 0; i < people.length; i++) {
            const person = people[i];
            context.fillStyle = person.bg.rgb;
            context.beginPath();
            context.arc(person.pos.x, person.pos.y, personRadius, 0, Math.PI * 2);
            context.fill();
        }

        for (let i = 0; i < people.length; i++) {
            // Draw name
            const person = people[i];
            context.fillStyle = person.fg.rgb;
            context.font = font;
            context.fillText(person.name, person.pos.x - context.measureText(person.name).width / 2, person.pos.y + 3);
        }

        if (!paused) {
            updatePeople();
        }
        lastUpdateTime = currentTime;
    }

    requestAnimationFrame(render);
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
