import words from "./words";

export const ROWS_COUNT = 5;
export const WORD_LENGTH = 5;

export const CLUE_NONE = "";
export const CLUE_RIGHT = "G";
export const CLUE_MISPLACED = "Y";
export const CLUE_WRONG = "W";

const RANK_WORDS_LIMIT = 1000;

export function candidates(
    chars: string[],
    clues: string[],
    limit: number
): string[] {
    const regexes = createRegexes(chars, clues);
    console.log(regexes);

    const filterFn = (word: string): boolean => {
        for (let i = 0; i < regexes.length; i++) {
            if (!regexes[i].test(word)) {
                return false;
            }
        }
        return true;
    };

    const result = [];
    for (let i = 0; i < words.length; i++) {
        if (filterFn(words[i])) {
            result.push(words[i]);
        }
    }

    if (result.length < RANK_WORDS_LIMIT) {
        rankWords(result);
    }

    return result.splice(0, limit);
}

function createRegexes(chars: string[], clues: string[]): RegExp[] {
    const noMatch = new Set<string>();
    const allMatch: string[] = ".".repeat(WORD_LENGTH).split("");
    const anyMatch: { [index: number]: Set<string> } = {};

    for (let i = 0; i < clues.length; i++) {
        const j = i % WORD_LENGTH;
        if (clues[i] == CLUE_RIGHT) {
            allMatch[j] = chars[i];
        } else if (clues[i] == CLUE_WRONG) {
            noMatch.add(chars[i]);
        } else if (clues[i] == CLUE_MISPLACED) {
            if (!anyMatch[j]) {
                anyMatch[j] = new Set<string>();
            }
            anyMatch[j].add(chars[i]);
        }
    }

    const patterns: RegExp[] = [];

    const matchRe: string[] = [];
    for (let i = 0; i < WORD_LENGTH; i++) {
        if (allMatch[i] != ".") {
            matchRe[i] = allMatch[i];
        } else if (anyMatch[i]) {
            matchRe[i] =
                "[^" +
                Array.from(anyMatch[i]).join("") +
                Array.from(noMatch).join("") +
                "]";
        } else if (noMatch.size > 0) {
            matchRe[i] = "[^" + Array.from(noMatch).join("") + "]";
        } else {
            matchRe[i] = ".";
        }
    }
    patterns.push(new RegExp(matchRe.join("")));

    for (let i in anyMatch) {
        for (let c of anyMatch[i]) {
            const anyRe: string[] = [];
            for (let k = 0; k < WORD_LENGTH; k++) {
                if (anyMatch[k] && anyMatch[k].has(c)) {
                    continue;
                }
                const left = ".".repeat(Number(k));
                const right = ".".repeat(WORD_LENGTH - Number(k) - 1);
                anyRe.push(left + c + right);
            }
            patterns.push(new RegExp(anyRe.join("|")));
        }
    }

    return patterns;
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

function rankWords(words: string[]): string[] {
    let total = 0;
    const wins: { [index: string]: number } = {};

    for (let a of words) {
        for (let b of words) {
            if (a == b) {
                continue;
            }
            const s = score(a, b);
            if (wins[a]) {
                wins[a] += s;
            } else {
                wins[a] = s;
            }
            total += s;
        }
    }

    for (let i in wins) {
        wins[i] = wins[i] / total;
    }

    words.sort((a: string, b: string): number => {
        return wins[b] - wins[a];
    });

    return words;
}

function score(a: string, b: string): number {
    let rightSpot = 0;
    let wrongSpot = 0;

    for (let i = 0; i < WORD_LENGTH; i++) {
        if (a[i] == b[i]) {
            a = a.substring(0, i) + "_" + a.substring(i + 1);
            rightSpot++;
        }
    }

    for (let i = 0; i < WORD_LENGTH; i++) {
        if (a[i] == "_") {
            continue;
        }
        let j = b.indexOf(a[i]);
        if (j != -1) {
            b = b.substring(0, j) + "_" + b.substring(j + 1);
            wrongSpot++;
        }
    }

    return rightSpot + wrongSpot / 2;
}
