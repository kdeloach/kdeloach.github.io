import React, { KeyboardEvent, ChangeEvent, useState, useEffect, useRef, useContext } from "react";
import { ROWS_COUNT, WORD_LENGTH, CLUE_NONE, CLUE_RIGHT, CLUE_WRONG, CLUE_MISPLACED, findMatchingWords, findMatchingWordsUnknownLettersOnly } from "./wordle";
import { WORD_LIST, WORDS_ALLOWED, WORDS_ANSWERS } from "./words";

interface IAppContext {
    onTileChange: (tileIndex: number, char: string) => void;
    onClueChanged: (tileIndex: number, clue: string) => void;
    onTileBackspace: () => void;
    onTileEnter: () => void;
}

const AppContext = React.createContext<IAppContext>(null);

interface AppState {
    activeTileIndex: number;
    chars: string[];
    clues: string[];
    guess: string;
}

function newState(): AppState {
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
        guess: "",
    };
}

export const WordleForm = () => {
    const [state, setState] = useState<AppState>(() => newState());
    const { activeTileIndex, chars, clues } = state;

    const appContext = {
        onTileChange: (tileIndex: number, char: string) => {
            if (!isAlpha(char)) {
                return;
            }

            chars[tileIndex] = char;

            // const lo = getRowIndex(tileIndex) * WORD_LENGTH;
            // const hi = lo + WORD_LENGTH - 1;
            // const nextTileIndex = clamp(tileIndex + 1, lo, hi);
            const nextTileIndex = clamp(tileIndex + 1, 0, chars.length - 1);

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

            setState((state) => ({
                ...state,
                activeTileIndex: nextTileIndex,
            }));
        },
        onTileEnter: () => {},
        onClueChanged: (tileIndex: number, clue: string) => {
            if (clues[tileIndex] === clue) {
                clues[tileIndex] = CLUE_NONE;
            } else {
                clues[tileIndex] = clue;
            }
            setState((state) => ({ ...state }));
        },
    };

    const matches = findMatchingWords(chars, clues) || [];
    const guess = (matches.length && matches[0]) || "";
    const chance = formatPercent((matches.length && 1 / matches.length) || 0);
    const guessTiles = [];
    for (let i = 0; i < guess.length; i++) {
        guessTiles.push(<ReadOnlyTile key={i} char={guess[i]} clue={CLUE_NONE} />);
    }

    const altMatches = findMatchingWordsUnknownLettersOnly(chars, clues) || [];
    const altGuess = (altMatches.length && altMatches[0]) || "";
    const altChance = formatPercent((altMatches.length && 1 / altMatches.length) || 0);
    const altGuessTiles = [];
    for (let i = 0; i < altGuess.length; i++) {
        altGuessTiles.push(<ReadOnlyTile key={i} char={altGuess[i]} clue={CLUE_NONE} />);
    }

    const rows = [];
    for (let i = 0; i < ROWS_COUNT; i++) {
        const props = { rowIndex: i, activeTileIndex, chars, clues };
        rows.push(<Row key={i} {...props} />);
    }

    return (
        <AppContext.Provider value={appContext}>
            <div className="wordle-form">
                <div className="grid">{rows}</div>
                <div className="guess">
                    {(guess.length && (
                        <p>
                            <div>Try...</div>
                            <div>
                                {guessTiles} ({chance})
                            </div>
                            {(altGuess.length && altGuess !== guess && (
                                <>
                                    <div>or</div>
                                    <div>
                                        {altGuessTiles} ({altChance})
                                    </div>
                                </>
                            )) ||
                                null}
                        </p>
                    )) || <>No solution?</>}
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
    const { onTileBackspace, onTileEnter, onTileChange, onClueChanged } = useContext(AppContext);

    const ref = useRef<HTMLInputElement>();

    useEffect(() => {
        if (tileActive) {
            ref.current.focus();
        }
    });

    const onChange = (e: ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        const char = e.target.value[e.target.value.length - 1];
        onTileChange(tileIndex, char);
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
        <div className="tile-input">
            <input type="text" inputMode="email" className={"tile " + "tile-" + clue} ref={ref} onChange={onChange} onKeyDown={onKeyDown} value={char} />
            <div className="tile-clue-input">
                <div className="tile-clue tile-G" onClick={() => onClueChanged(tileIndex, CLUE_RIGHT)}></div>
                <div className="tile-clue tile-Y" onClick={() => onClueChanged(tileIndex, CLUE_MISPLACED)}></div>
                <div className="tile-clue tile-W" onClick={() => onClueChanged(tileIndex, CLUE_WRONG)}></div>
            </div>
        </div>
    );
};

interface ReadOnlyTileProps {
    char: string;
    clue: string;
}

const ReadOnlyTile = ({ char, clue }: ReadOnlyTileProps) => {
    return <div className={`tile-small tile-${clue}`}>{char}</div>;
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

function formatPercent(perc: number): string {
    const n = Math.round(perc * 100);
    if (n == 0) {
        return "< 1%";
    }
    return `${n}%`;
}
