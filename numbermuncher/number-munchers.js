// Number Muncher Game using Canvas

let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
let gridSize = 5;
let cellSize = canvas.width / gridSize;
let targetNumber = 0;
let score = 0;
let board = [];
let muncher = {
    x: Math.floor(gridSize / 2),
    y: Math.floor(gridSize / 2),
};
const fontSize = 16;

// Draw a single cell
function drawCell(x, y, number) {
    ctx.fillStyle = "#333";
    ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    ctx.strokeStyle = "#fff";
    ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
    if (number != null) {
        ctx.font = `${fontSize}px Arial`;
        ctx.textAlign = "center";
        ctx.fillStyle = "#fff";
        ctx.fillText(number, x * cellSize + cellSize / 2, y * cellSize + cellSize / 2);
    }
}

// Draw the Muncher
function drawMuncher() {
    ctx.fillStyle = "green";
    ctx.fillRect(muncher.x * cellSize, muncher.y * cellSize, cellSize, cellSize);
}

// Create the game board
function createBoard() {
    board = [];
    for (let y = 0; y < gridSize; y++) {
        board[y] = [];
        for (let x = 0; x < gridSize; x++) {
            let number = Math.floor(Math.random() * 10);
            board[y][x] = number;
            drawCell(x, y, number);
        }
    }
    drawMuncher();
}

// Move the Muncher
function moveMuncher(x, y) {
    if (muncher.x + x >= 0 && muncher.x + x < gridSize && muncher.y + y >= 0 && muncher.y + y < gridSize) {
        drawCell(muncher.x, muncher.y, board[muncher.y][muncher.x]);
        muncher.x += x;
        muncher.y += y;
        drawCell(muncher.x, muncher.y, board[muncher.y][muncher.x]);
        drawMuncher();
    }
}

function munch() {
    if (board[muncher.y][muncher.x] === targetNumber) {
        score++;
        document.getElementById("score").textContent = `Score: ${score}`;
    }
    board[muncher.y][muncher.x] = null;
    drawCell();
    drawMuncher();
}

// Handle keyboard input
window.addEventListener(
    "keydown",
    function (evt) {
        switch (evt.key) {
            case "ArrowUp":
                moveMuncher(0, -1);
                break;
            case "ArrowDown":
                moveMuncher(0, 1);
                break;
            case "ArrowLeft":
                moveMuncher(-1, 0);
                break;
            case "ArrowRight":
                moveMuncher(1, 0);
                break;
            case " ":
                munch();
                break;
        }
    },
    false,
);

// Start the game
function startGame() {
    targetNumber = Math.floor(Math.random() * 10);
    document.getElementById("target").textContent = `Munch the number: ${targetNumber}`;
    createBoard();
}

// Reset the game
function resetGame() {
    score = 0;
    document.getElementById("score").textContent = `Score: ${score}`;
    muncher.x = Math.floor(gridSize / 2);
    muncher.y = Math.floor(gridSize / 2);
    startGame();
}

// Start the game when the page loads
window.onload = startGame;

// Load the sprite sheet
let spriteSheet = new Image();
spriteSheet.src = "path/to/sprite-sheet.png";

// Define the size of each sprite
let spriteSize = {
    width: 32,
    height: 32,
};

// Define the animation frames
let animationFrames = [
    [0, 0], // x, y position of the first frame in the sprite sheet
    [spriteSize.width, 0], // x, y position of the second frame in the sprite sheet
    // add more frames as needed
];

// Define the animation timing
let animationSpeed = 100; // milliseconds per frame
let currentFrame = 0;
let lastFrameTime = 0;

// Draw the current animation frame on the canvas
function drawSprite() {
    let now = Date.now();
    if (now - lastFrameTime >= animationSpeed) {
        currentFrame = (currentFrame + 1) % animationFrames.length;
        lastFrameTime = now;
    }
    let frame = animationFrames[currentFrame];
    ctx.drawImage(spriteSheet, frame[0], frame[1], spriteSize.width, spriteSize.height, muncher.x * cellSize, muncher.y * cellSize, cellSize, cellSize);
}

// Update the game loop
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawSprite();
    requestAnimationFrame(gameLoop);
}

// Start the game loop when the sprite sheet is loaded
spriteSheet.onload = function () {
    requestAnimationFrame(gameLoop);
};
