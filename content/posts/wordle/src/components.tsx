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

const GUESS_WORDS_LIMIT = 7;
const GUESS_WORDS_ALT_LIMIT = 3;

interface AppState {
    activeTileIndex: number;
    chars: string[];
    clues: string[];
    answer: string;
    guessWords: string[];
    guessWordsAlt: string[];
    error: string;
}

function newState(answer: string): AppState {
    const chars = [];
    const clues = [];
    for (let i = 0; i < ROWS_COUNT * WORD_LENGTH; i++) {
        chars[i] = "";
        clues[i] = CLUE_NONE;
    }
    const guessWords = candidatesRanked(
        chars,
        clues,
        WORDS_ANSWERS,
        GUESS_WORDS_LIMIT
    );
    return {
        activeTileIndex: 0,
        chars,
        clues,
        answer,
        guessWords,
        guessWordsAlt: [],
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

export const WordleForm: React.FC = () => {
    const [state, setState] = useState<AppState>(() =>
        newState(wordFromQuerystring())
    );
    const {
        activeTileIndex,
        chars,
        clues,
        answer,
        guessWords,
        guessWordsAlt,
        error,
    } = state;

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

            let guessWords = candidatesRanked(
                chars,
                clues,
                WORDS_ANSWERS,
                GUESS_WORDS_LIMIT
            );
            let guessWordsAlt = candidatesRanked(
                chars,
                // clues,
                clues.map((c) => (c == CLUE_RIGHT ? CLUE_NONE : c)),
                WORDS_ALLOWED,
                GUESS_WORDS_LIMIT
            );

            guessWordsAlt = guessWordsAlt.filter(
                (w) => !guessWords.includes(w)
            );

            setState((state) => ({
                ...state,
                error: "",
                activeTileIndex: rowIndex + WORD_LENGTH,
                guessWords,
                guessWordsAlt,
            }));
        },
    };

    const getCurrentWord = () => {
        const i = getRowIndex(activeTileIndex) * WORD_LENGTH;
        return chars.slice(i, i + WORD_LENGTH).join("");
    };

    const newGame = () => {
        setState(newState(randomWord()));
    };

    const retry = () => {
        setState({ ...newState(randomWord()), answer });
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

    let guessWordsAltDisplay: string[] = [];
    if (guessWords.length > 1 && guessWordsAlt.length > 0) {
        guessWordsAltDisplay = guessWordsAlt.slice(0, GUESS_WORDS_ALT_LIMIT);
    }

    let guessWordsDisplay = guessWords.slice(
        0,
        GUESS_WORDS_LIMIT - guessWordsAltDisplay.length
    );

    return (
        <AppContext.Provider value={appContext}>
            <div className="wordle-form">
                <div className="grid">{rows}</div>
                <div className="guess">
                    <button onClick={newGame}>New Game</button>
                    <button onClick={retry}>Retry</button>
                    {error.length > 0 ? (
                        <span className="error">Error: {error}</span>
                    ) : (
                        ""
                    )}
                    Guess:
                    <ul>
                        {guessWordsDisplay.map((w) => (
                            <li key={w}>{w}</li>
                        ))}
                    </ul>
                    {guessWordsAltDisplay.length > 0 && (
                        <>
                            Alt Guess:
                            <ul>
                                {guessWordsAltDisplay.map((w) => (
                                    <li key={w}>{w}</li>
                                ))}
                            </ul>
                        </>
                    )}
                </div>
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

const Row: React.FC<RowProps> = ({
    rowIndex,
    activeTileIndex,
    chars,
    clues,
}) => {
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

const Tile: React.FC<TileProps> = ({ tileIndex, tileActive, char, clue }) => {
    const { onTileBackspace, onTileEnter, onTileChange } =
        useContext(AppContext);

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
