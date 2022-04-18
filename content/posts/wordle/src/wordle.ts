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
    const regexes = createRegexes(chars, clues);
    const filterWord = createFilterFn(regexes);

    const result = [];

    for (let i = 0; i < words.length; i++) {
        if (filterWord(words[i])) {
            result.push(words[i]);
            if (result.length >= CANDIDATES_LIMIT) {
                break;
            }
        }
    }

    return result;
}

function createRegexes(chars: string[], clues: string[]): RegExp[] {
    let letters = "[" + LETTERS + "]";
    let allMatchExact = [letters, letters, letters, letters, letters];
    let allMatchAny: { [index: string]: number } = {};
    let noMatch: { [index: string]: number } = {};

    for (let i = 0; i < clues.length; i++) {
        const j = i % WORD_LENGTH;
        if (clues[i] == CLUE_RIGHT) {
            allMatchExact[j] = chars[i];
        } else if (clues[i] == CLUE_WRONG) {
            allMatchExact = allMatchExact.map((str) =>
                str.replace(chars[i], "")
            );
        } else if (clues[i] == CLUE_MISPLACED) {
            allMatchAny[chars[i]] = 1;
            allMatchExact[j] = allMatchExact[j].replace(chars[i], "");
        }
    }

    const patterns = [new RegExp(allMatchExact.join(""))];

    for (const k in allMatchAny) {
        patterns.push(new RegExp(k));
    }

    return patterns;
}

function createFilterFn(regexes: RegExp[]): (word: string) => boolean {
    return (word: string): boolean => {
        for (let i = 0; i < regexes.length; i++) {
            if (!regexes[i].test(word)) {
                return false;
            }
        }
        return true;
    };
}

export function randomWord(): string {
    return words[Math.floor(Math.random() * words.length)];
}

export function generateClues(answer: string, guess: string): string[] {
    const clues = [];
    for (let i = 0; i < answer.length; i++) {
        if (!guess[i]) {
            clues[i] = CLUE_NONE;
        }
        if (answer[i] == guess[i]) {
            clues[i] = CLUE_RIGHT;
        } else if (answer.includes(guess[i])) {
            clues[i] = CLUE_MISPLACED;
        } else {
            clues[i] = CLUE_WRONG;
        }
    }
    return clues;
}
