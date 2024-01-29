import React, { useState, useEffect, useRef, useCallback } from "react";

const fireTV = `
1234567890
abcdefghij
klmnopqrst
uvwxyz!,.@
`.trim();

function parseKeyboardLayout(input: string): [string[][], string | null] {
    const trimmedInput = input.trim();
    const rows = trimmedInput.split("\n");
    const grid: string[][] = rows.map((row) => row.split(""));

    // Validate
    const numRows = grid.length;
    const numCols = grid[0].length;
    const seen: { [key: string]: boolean } = {};
    if (!numCols) {
        return [grid, "empty keyboard layout"];
    }
    for (let y = 0; y < numRows; y++) {
        if (grid[y].length !== numCols) {
            return [grid, "must use same number of columns for each row"];
        }
        for (let x = 0; x < numCols; x++) {
            const c = grid[y][x];
            if (seen[c]) {
                return [grid, `duplicate character: ${c}`];
            }
            seen[c] = true;
        }
    }

    return [grid, null];
}

type XY = {
    x: number;
    y: number;
};

// Fisher-Yates shuffle function to shuffle an array in-place
function shuffleArray(array: XY[]): XY[] {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function dfs(grid: string[][], currentPosition: XY, visited: boolean[][], targetLength: number, currentString: string, overlap: boolean): string {
    const numRows = grid.length;
    const numCols = grid[0].length;

    // Base case: If the current string length reaches the target, return it
    if (currentString.length === targetLength) {
        return currentString;
    }

    // Mark the current position as visited
    visited[currentPosition.y][currentPosition.x] = true;

    // Define the possible moves (up, down, left, right)
    const moves: XY[] = shuffleArray([
        { x: 0, y: -1 }, // Move up
        { x: 0, y: 1 }, // Move down
        { x: -1, y: 0 }, // Move left
        { x: 1, y: 0 }, // Move right
    ]);

    // Explore each possible move
    for (const move of moves) {
        const nextX = currentPosition.x + move.x;
        const nextY = currentPosition.y + move.y;

        // Filter invalid moves
        if (nextX < 0 || nextX >= numCols || nextY < 0 || nextY >= numRows) {
            continue;
        }

        // Filter visited nodes
        if (!overlap && visited[nextY][nextX]) {
            continue;
        }

        // Recursively explore the next position
        const nextString = dfs(grid, { x: nextX, y: nextY }, visited, targetLength, currentString + grid[nextY][nextX], overlap);

        // If a valid string is found, return it
        if (nextString) {
            return nextString;
        }
    }

    // Mark the current position as unvisited (backtrack)
    visited[currentPosition.y][currentPosition.x] = false;

    return "";
}

function getLetter(keyboardLayout: string[][], letter: string): XY | null {
    const numRows = keyboardLayout.length;
    const numCols = keyboardLayout[0].length;
    for (let y = 0; y < numRows; y++) {
        for (let x = 0; x < numCols; x++) {
            if (keyboardLayout[y][x] === letter) {
                return { x, y };
            }
        }
    }
    return null;
}

function getRandomLetter(keyboardLayout: string[][]): XY | null {
    const numRows = keyboardLayout.length;
    const numCols = keyboardLayout[0].length;

    const y = Math.floor(Math.random() * numRows);
    const x = Math.floor(Math.random() * numCols);

    return { x, y };
}

// Debounce decorator function
function debounce(fn: any, delay: number) {
    let timeoutId: any;
    return function (...args: any) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            fn(...args);
        }, delay);
    };
}

type SmartTVKeyboardProps = {
    keyboardLayout: string[][];
    password: string;
    overlap: boolean;
    onKeyClicked: (letter: string) => void;
};

const SmartTVKeyboard = ({ keyboardLayout, password, overlap, onKeyClicked }: SmartTVKeyboardProps) => {
    const [bgImage, setBgImage] = useState("");

    const parentRef = useRef(null);

    const updateBgImage = () => {
        const parentElement = parentRef.current;
        if (!parentElement) return;

        const parentRect = parentElement.getBoundingClientRect();
        const childElements = parentElement.querySelectorAll(".keyboard-key");

        const points: { [key: string]: XY } = {};

        for (let i = 0; i < childElements.length; i++) {
            const childElement = childElements[i];
            const { left, top, width, height } = childElement.getBoundingClientRect();

            // Calculate the centroid
            const centerX = left + width / 2 - parentRect.left;
            const centerY = top + height / 2 - parentRect.top;

            points[childElement.innerText] = { x: centerX, y: centerY };
        }

        const selectedPoints: XY[] = [];

        for (let i = 0; i < password.length; i++) {
            const c = password[i];
            const pos = points[c];
            if (!pos) {
                console.log("Error finding position of element for letter: ", c);
                break;
            }
            selectedPoints.push(pos);
        }

        const dataUrl = generateConnectedLinesImage(parentRect.width, parentRect.height, 10, selectedPoints);
        setBgImage(dataUrl);
    };

    useEffect(() => {
        updateBgImage();
    });

    useEffect(() => {
        const handleResize = debounce(() => {
            updateBgImage();
        }, 300);

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []); // Empty dependency array to run the effect only once

    const className = (letter: string) => {
        const i = password.indexOf(letter);
        if (i === 0) {
            return "active first";
        } else if (i > 0) {
            return "active";
        }
        return "";
    };

    // Render the keyboard layout
    return (
        <div ref={parentRef} className="smart-tv-keyboard" style={{ backgroundImage: `url(${bgImage})` }}>
            {keyboardLayout.map((row, rowIndex) => (
                <div key={rowIndex} className="keyboard-row">
                    {row.map((letter, colIndex) => (
                        <div key={colIndex} className={`keyboard-key ${className(letter)}`} onClick={() => onKeyClicked(letter)}>
                            {letter}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};

function generateConnectedLinesImage(width: number, height: number, lineWidth: number, points: XY[]): string {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");

    context.strokeStyle = "gray"; // Line color
    context.lineWidth = lineWidth;

    context.beginPath();
    if (points.length > 0) {
        context.moveTo(points[0].x, points[0].y);

        for (let i = 1; i < points.length; i++) {
            context.lineTo(points[i].x, points[i].y);
        }
    }
    context.stroke();

    // Convert the canvas to a data URL string
    const dataUrl = canvas.toDataURL();

    return dataUrl;
}

export function MarkovPasswordGenerator() {
    const [keyboardLayoutVal, setKeyboardLayoutVal] = useState(fireTV);
    const [password, setPassword] = useState("");
    const [overlap, setOverlap] = useState(false);
    const [passwordLength, setPasswordLength] = useState(12);

    const [keyboardLayout, error] = parseKeyboardLayout(keyboardLayoutVal);

    if (!error) {
        const numRows = keyboardLayout.length;
        const numCols = keyboardLayout[0].length;
        const passwordLengthMax = numRows * numCols;

        // Set min/max password length
        if (passwordLength < 1) {
            setPasswordLength(1);
        } else if (passwordLength > passwordLengthMax) {
            setPasswordLength(passwordLengthMax);
        }
    }

    const generatePassword = (start: XY): string => {
        const visited: boolean[][] = keyboardLayout.map((row) => row.map(() => false));
        const password = dfs(keyboardLayout, start, visited, passwordLength, keyboardLayout[start.y][start.x], overlap);
        return password;
    };

    const onGeneratePasswordClicked = useCallback(() => {
        // Try 10 times in case there's no solution. For example, if you ask
        // for a password of length 9 on a 3x3 grid, starting from an edge.
        for (let i = 0; i < 10; i++) {
            let start = getRandomLetter(keyboardLayout);
            const password = generatePassword(start);
            if (password) {
                console.log(password);
                setPassword(password);
                return;
            }
        }
    }, [keyboardLayout]);

    const onKeyClicked = useCallback(
        (letter: string) => {
            let start = getLetter(keyboardLayout, letter);
            const password = generatePassword(start);
            console.log(password);
            setPassword(password);
        },
        [keyboardLayout],
    );

    const onKeyboardLayoutChanged = (e: React.FormEvent<HTMLTextAreaElement>) => {
        setPassword("");
        setKeyboardLayoutVal(e.currentTarget.value);
    };

    const onPasswordLengthChanged = (e: React.FormEvent<HTMLInputElement>) => {
        let n = parseInt(e.currentTarget.value, 10) || 0;
        setPasswordLength(n);
    };

    useEffect(() => {
        onGeneratePasswordClicked();
    }, []);

    return (
        <>
            <SmartTVKeyboard keyboardLayout={keyboardLayout} password={password} overlap={overlap} onKeyClicked={onKeyClicked} />
            <p className="password">{(password.length > 0 && password) || "no solution"}</p>
            <p className="form">
                <button onClick={onGeneratePasswordClicked} disabled={error != null}>
                    Generate Password
                </button>
                {error != null && <span className="error">Error: {error}</span>}
                <label>
                    Length: <input type="number" value={passwordLength || ""} onChange={onPasswordLengthChanged} />
                </label>
                <label>
                    Allow repeat characters? <input type="checkbox" checked={overlap} onChange={(e) => setOverlap(e.target.checked)} />
                </label>
            </p>
            <p></p>
            <p></p>
            <fieldset style={{ display: "none" }}>
                <legend>Keyboard Layout</legend>
                <textarea value={keyboardLayoutVal} onChange={onKeyboardLayoutChanged} style={{ width: "200px", height: "100px" }} />
            </fieldset>
        </>
    );
}
