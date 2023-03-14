import { WORD_LIST, WORDS_ANSWERS } from "./words";

export const ROWS_COUNT = 5;
export const WORD_LENGTH = 5;

export const CLUE_NONE = "";
export const CLUE_RIGHT = "G";
export const CLUE_MISPLACED = "Y";
export const CLUE_WRONG = "W";

const RANK_WORDS_LIMIT = 1000;

export function candidatesRanked(chars: string[], clues: string[], words: string[], limit: number = -1): string[] {
    const result = candidates(chars, clues, words);
    if (result.length < RANK_WORDS_LIMIT) {
        rankWordsFast(result);
    }
    return result.slice(0, limit);
}

export function candidates(chars: string[], clues: string[], words: string[]): string[] {
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
    return result;
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
            matchRe[i] = "[^" + Array.from(anyMatch[i]).join("") + Array.from(noMatch).join("") + "]";
        } else if (noMatch.size > 0) {
            matchRe[i] = "[^" + Array.from(noMatch).join("") + "]";
        } else {
            matchRe[i] = ".";
        }
    }
    patterns.push(new RegExp(matchRe.join("")));

    const seen = new Set<string>();
    for (let i in anyMatch) {
        for (let c of anyMatch[i]) {
            if (seen.has(c)) {
                continue;
            }
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
            seen.add(c);
        }
    }

    return patterns;
}

export function randomWord(): string {
    return WORDS_ANSWERS[Math.floor(Math.random() * WORDS_ANSWERS.length)];
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

function rankWordsFast(words: string[]): string[] {
    const wins: { [index: string]: number } = {};

    for (let a of words) {
        if (!WORDS_ANSWERS.includes(a)) {
            continue;
        }
        const h = handicap(a);
        for (let b of words) {
            if (a == b) {
                continue;
            }
            const s = score(a, b) - h;
            if (wins[a]) {
                wins[a] += s;
            } else {
                wins[a] = s;
            }
        }
    }

    words.sort((a: string, b: string): number => {
        // descending
        return (wins[b] || 0) - (wins[a] || 0);
    });
    console.log(words);
    return words;
}

function rankWordsSlow(words: string[]): string[] {
    const wins: { [index: string]: number } = {};

    for (let a of words) {
        for (let b of words) {
            if (a == b) {
                continue;
            }
            const s = score2(a, b, words);
            if (wins[a]) {
                wins[a] += s;
            } else {
                wins[a] = s;
            }
        }
    }

    words.sort((a: string, b: string): number => {
        // ascending
        return wins[a] - wins[b];
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

function handicap(a: string): number {
    const seen: { [index: string]: boolean } = {};
    for (let i = 0; i < a.length; i++) {
        if (seen[a[i]]) {
            return 1;
        }
        seen[a[i]] = true;
    }
    return 0;
}

function score2(a: string, b: string, words: string[]): number {
    const chars = a.split("");
    const clues = generateClues(a, b);
    return candidates(chars, clues, words).length;
}

function clueValue(clue: string) {
    if (clue === CLUE_NONE) {
        return 0;
    } else if (clue === CLUE_WRONG) {
        return 1;
    } else if (clue === CLUE_MISPLACED) {
        return 2;
    } else if (clue === CLUE_RIGHT) {
        return 3;
    }
    return -1;
}

export function bestGuessForEachLetter(chars: string[], clues: string[]): Record<string, string> {
    const best: Record<string, string> = {};
    for (let i = 0; i < chars.length; i++) {
        const char = chars[i];
        const clue = clues[i];
        if (!best[char] || clueValue(clue) > clueValue(best[char])) {
            best[char] = clue;
        }
    }
    return best;
}
