import words from "./words";

export const ROWS_COUNT = 5;
export const WORD_LENGTH = 5;

export const CLUE_NONE = "";
export const CLUE_RIGHT = "G";
export const CLUE_MISPLACED = "Y";
export const CLUE_WRONG = "W";

const LETTERS = "abcdefghijklmnopqrstuvwxyz";

const CANDIDATES_LIMIT = 5;

export function candidates(chars: string[], clues: string[]): string[] {
    const regex = createRegex(chars, clues);
    console.log(regex);

    const result = [];
    for (let i = 0; i < words.length; i++) {
        if (regex.test(words[i])) {
            result.push(words[i]);
            if (result.length >= CANDIDATES_LIMIT) {
                break;
            }
        }
    }
    return result;
}

function createRegex(chars: string[], clues: string[]): RegExp {
    const noMatch: string[] = [];
    const allMatch: string[] = ".".repeat(WORD_LENGTH).split("");
    const anyMatch: { [index: number]: string[] } = {};

    for (let i = 0; i < clues.length; i++) {
        const j = i % WORD_LENGTH;
        if (clues[i] == CLUE_RIGHT) {
            allMatch[j] = chars[i];
        } else if (clues[i] == CLUE_WRONG) {
            noMatch.push(chars[i]);
        } else if (clues[i] == CLUE_MISPLACED) {
            if (!anyMatch[j]) {
                anyMatch[j] = [];
            }
            anyMatch[j].push(chars[i]);
        }
    }

    const pattern: string[] = [];
    for (let i = 0; i < WORD_LENGTH; i++) {
        if (allMatch[i] != ".") {
            pattern[i] = allMatch[i];
        } else if (anyMatch[i]) {
            pattern[i] = "[^" + anyMatch[i].join("") + noMatch.join("") + "]";
        } else if (noMatch.length > 0) {
            pattern[i] = "[^" + noMatch.join("") + "]";
        } else {
            pattern[i] = ".";
        }
    }
    return new RegExp(pattern.join(""));
}

export function randomWord(): string {
    return words[Math.floor(Math.random() * words.length)];
}

export function generateClues(answer: string, guess: string): string[] {
    const clues = [];
    for (let i = 0; i < answer.length; i++) {
        if (!guess[i]) {
            clues[i] = CLUE_NONE;
        } else if (answer[i] == guess[i]) {
            clues[i] = CLUE_RIGHT;
        } else if (answer.includes(guess[i])) {
            clues[i] = CLUE_MISPLACED;
        } else {
            clues[i] = CLUE_WRONG;
        }
    }
    return clues;
}
