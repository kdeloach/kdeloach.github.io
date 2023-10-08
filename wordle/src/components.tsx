import {
    ROWS_COUNT,
    randomWord,
    generateClues,
    WORD_LENGTH,
    CLUE_NONE,
    CLUE_RIGHT,
    CLUE_WRONG,
    CLUE_MISPLACED,
    candidatesRanked,
    bestGuessForEachLetter,
} from "./wordle";
import { WORD_LIST, WORDS_ALLOWED, WORDS_ANSWERS } from "./words";
import React, {
    RefObject,
    MouseEvent,
    KeyboardEvent,
    ChangeEvent,
    useState,
    useEffect,
    useRef,
    useContext,
} from "react";

interface IAppContext {
    onTileChange: (char: string) => void;
    onTileBackspace: () => void;
    onTileEnter: () => void;
}

const AppContext = React.createContext<IAppContext>(null);

interface AppState {
    activeTileIndex: number;
    chars: string[];
    clues: string[];
    answer: string;
    error: string;
}

function newState(answer: string): AppState {
    const chars = [];
    const clues = [];
    for (let i = 0; i < ROWS_COUNT * WORD_LENGTH; i++) {
        chars[i] = "";
        clues[i] = CLUE_NONE;
    }
    return {
        activeTileIndex: 0,
        chars,
        clues,
        answer,
        error: "",
    };
}

function wordFromQuerystring(): string {
    if (location.search.length > 0) {
        const qs = location.search.split("=");
        if (qs.length == 2) {
            return qs[1];
        }
    }
    return randomWord();
}

export const WordleForm = () => {
    const [state, setState] = useState<AppState>(() => newState(wordFromQuerystring()));
    const { activeTileIndex, chars, clues, answer, error } = state;
    const bestClues = bestGuessForEachLetter(chars, clues);

    const appContext = {
        onTileChange: (char: string) => {
            if (!isAlpha(char)) {
                return;
            }
            if (chars[activeTileIndex]) {
                return;
            }

            chars[activeTileIndex] = char;

            const lo = getRowIndex(activeTileIndex) * WORD_LENGTH;
            const hi = lo + WORD_LENGTH - 1;
            const nextTileIndex = clamp(activeTileIndex + 1, lo, hi);

            setState((state) => ({
                ...state,
                activeTileIndex: nextTileIndex,
            }));
        },
        onTileBackspace: () => {
            let nextTileIndex = activeTileIndex;
            if (!chars[activeTileIndex]) {
                nextTileIndex = activeTileIndex - 1;
            }
            if (nextTileIndex < 0) {
                nextTileIndex = 0;
            }

            chars[nextTileIndex] = "";
            clues[nextTileIndex] = CLUE_NONE;

            setState((state) => ({
                ...state,
                activeTileIndex: nextTileIndex,
            }));
        },
        onTileEnter: () => {
            const currentWord = getCurrentWord();
            if (currentWord.length < WORD_LENGTH) {
                setState((state) => ({
                    ...state,
                    error: "incomplete word",
                }));
                return;
            }
            if (!WORD_LIST.includes(currentWord)) {
                setState((state) => ({
                    ...state,
                    error: "unknown word",
                }));
                return;
            }

            const newClues = generateClues(answer, currentWord);

            const rowIndex = getRowIndex(activeTileIndex) * WORD_LENGTH;
            for (let i = 0; i < newClues.length; i++) {
                clues[rowIndex + i] = newClues[i];
            }

            setState((state) => ({
                ...state,
                error: "",
                activeTileIndex: rowIndex + WORD_LENGTH,
            }));
        },
    };

    const getCurrentWord = () => {
        const i = getRowIndex(activeTileIndex) * WORD_LENGTH;
        return chars.slice(i, i + WORD_LENGTH).join("");
    };

    const rows = [];
    for (let i = 0; i < ROWS_COUNT; i++) {
        const props = {
            rowIndex: i,
            activeTileIndex,
            chars,
            clues,
        };
        rows.push(<Row key={i} {...props} />);
    }

    const letters = [];
    for (let n = 97; n < 123; n++) {
        const char = String.fromCharCode(n);
        const clue = bestClues[char] || CLUE_NONE;
        letters.push(<ReadOnlyTile key={n} char={char} clue={clue} />);
    }

    return (
        <AppContext.Provider value={appContext}>
            <div className="wordle-form">
                {(error.length > 0 && <span className="error">Error: {error}</span>) || null}
                <div className="grid">{rows}</div>
                <div className="letters">{letters}</div>
            </div>
        </AppContext.Provider>
    );
};

interface RowProps {
    rowIndex: number;
    activeTileIndex: number;
    chars: string[];
    clues: string[];
}

const Row = ({ rowIndex, activeTileIndex, chars, clues }: RowProps) => {
    const tiles = [];
    for (let i = 0; i < WORD_LENGTH; i++) {
        const tileIndex = rowIndex * WORD_LENGTH + i;
        const tileActive = tileIndex == activeTileIndex;
        const props = {
            tileIndex,
            tileActive,
            char: chars[tileIndex],
            clue: clues[tileIndex],
        };
        tiles.push(<Tile key={i} {...props} />);
    }
    return <div className="tile-row">{tiles}</div>;
};

interface TileProps {
    tileIndex: number;
    tileActive: boolean;
    char: string;
    clue: string;
}

const Tile = ({ tileIndex, tileActive, char, clue }: TileProps) => {
    const { onTileBackspace, onTileEnter, onTileChange } = useContext(AppContext);

    const ref = useRef<HTMLInputElement>();

    useEffect(() => {
        if (tileActive) {
            ref.current.focus();
        }
    }, [tileActive]);

    const onChange = (e: ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        const char = e.target.value[e.target.value.length - 1];
        onTileChange(char);
    };

    const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace") {
            e.preventDefault();
            onTileBackspace();
        } else if (e.key === "Enter") {
            e.preventDefault();
            onTileEnter();
        }
    };

    return (
        <input
            type="text"
            className={"tile " + "tile-" + clue}
            ref={ref}
            onChange={onChange}
            onKeyDown={onKeyDown}
            value={char}
            disabled={!tileActive}
        />
    );
};

interface ReadOnlyTileProps {
    char: string;
    clue: string;
}

const ReadOnlyTile = ({ char, clue }: ReadOnlyTileProps) => {
    return <div className={`tile tile-small tile-${clue}`}>{char}</div>;
};

function isAlpha(c: string): boolean {
    return (c >= "a" && c <= "z") || (c >= "A" && c <= "Z");
}

function clamp(n: number, lo: number, hi: number): number {
    if (n < lo) {
        return lo;
    } else if (n > hi) {
        return hi;
    }
    return n;
}

function getRowIndex(tileIndex: number): number {
    return Math.floor(tileIndex / WORD_LENGTH);
}
