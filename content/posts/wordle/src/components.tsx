import {
    ROWS_COUNT,
    randomWord,
    generateClues,
    WORD_LENGTH,
    CLUE_NONE,
    CLUE_RIGHT,
    CLUE_WRONG,
    CLUE_MISPLACED,
    bestWord,
} from "./wordle";
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
    setTile: (rowIndex: number, tileIndex: number) => void;
    setChar: (rowIndex: number, tileIndex: number, char: string) => void;
    setClue: (rowIndex: number, tileIndex: number, clue: string) => void;
    submit: () => void;
}

const AppContext = React.createContext<IAppContext>(null);

interface AppState {
    activeRow: number;
    activeTile: number;
    chars: string[];
    clues: string[];
    answer: string;
}

function newState(): AppState {
    const answer = randomWord();
    const chars = [];
    const clues = [];
    for (let i = 0; i < ROWS_COUNT * WORD_LENGTH; i++) {
        chars[i] = "";
        clues[i] = CLUE_NONE;
    }
    return {
        activeRow: 0,
        activeTile: 0,
        chars,
        clues,
        answer,
    };
}

export const WordleForm: React.FC = () => {
    const [state, setState] = useState<AppState>(() => newState());
    const { activeRow, activeTile, chars, clues, answer } = state;

    const appContext = {
        setTile: (rowIndex: number, tileIndex: number) =>
            setState((state) => ({
                ...state,
                activeRow: clamp(rowIndex, 0, ROWS_COUNT - 1),
                activeTile: clamp(tileIndex, 0, WORD_LENGTH - 1),
            })),
        setChar: (rowIndex: number, tileIndex: number, char: string) => {
            const i = rowIndex * WORD_LENGTH + tileIndex;
            chars[i] = char;
            setState({ ...state });
        },
        setClue: (rowIndex: number, tileIndex: number, clue: string) => {
            const i = rowIndex * WORD_LENGTH + tileIndex;
            clues[i] = clue;
            setState({ ...state });
        },
        submit: () => {
            const guess = getCurrentWord();
            const newClues = generateClues(answer, guess);

            const i = activeRow * WORD_LENGTH;
            for (let j = 0; j < newClues.length; j++) {
                clues[i + j] = newClues[j];
            }

            setState((state) => ({
                ...state,
                activeRow: clamp(activeRow + 1, 0, ROWS_COUNT - 1),
                activeTile: 0,
            }));
        },
    };

    const getCurrentWord = () => {
        const i = activeRow * WORD_LENGTH;
        return chars.slice(i, i + WORD_LENGTH).join("");
    };

    const rows = [];
    for (let i = 0; i < ROWS_COUNT; i++) {
        const rowActive = activeRow == i;
        const j = i * WORD_LENGTH;
        const rowChars = chars.slice(j, j + WORD_LENGTH);
        const rowClues = clues.slice(j, j + WORD_LENGTH);
        const guess = activeRow + 1 == i ? bestWord(chars, clues) : "";
        const props = {
            rowActive,
            rowIndex: i,
            activeTile: activeTile,
            chars: rowChars,
            clues: rowClues,
            guess,
        };
        rows.push(<Row key={i} {...props} />);
    }

    return (
        <AppContext.Provider value={appContext}>
            <div className="wordle-form">
                Answer: {answer}
                {rows}
            </div>
        </AppContext.Provider>
    );
};

interface RowProps {
    rowIndex: number;
    rowActive: boolean;
    activeTile: number;
    chars: string[];
    clues: string[];
    guess: string;
}

const Row: React.FC<RowProps> = ({
    rowIndex,
    rowActive,
    activeTile,
    chars,
    clues,
    guess,
}) => {
    const tiles = [];
    for (let i = 0; i < WORD_LENGTH; i++) {
        const tileActive = rowActive && activeTile == i;
        const props = {
            rowIndex,
            tileIndex: i,
            tileActive,
            char: chars[i],
            clue: clues[i],
            guess: guess[i],
        };
        tiles.push(<Tile key={i} {...props} />);
    }
    return <div className="row">{tiles}</div>;
};

interface TileProps {
    rowIndex: number;
    tileIndex: number;
    tileActive: boolean;
    char: string;
    clue: string;
    guess: string;
}

const Tile: React.FC<TileProps> = ({
    rowIndex,
    tileIndex,
    tileActive,
    char,
    clue,
    guess,
}) => {
    const { setTile, setChar, setClue, submit } = useContext(AppContext);

    const ref = useRef<HTMLInputElement>();

    useEffect(() => {
        if (tileActive) {
            ref.current.focus();
        }
    }, [tileActive]);

    const onChange = (e: ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        const char = e.target.value[e.target.value.length - 1];
        if (isAlpha(char)) {
            setChar(rowIndex, tileIndex, char);
            setTile(rowIndex, tileIndex + 1);
        }
    };

    const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        const up = () => setTile(rowIndex - 1, tileIndex);
        const down = () => setTile(rowIndex + 1, tileIndex);
        const left = () => setTile(rowIndex, tileIndex - 1);
        const right = () => setTile(rowIndex, tileIndex + 1);
        let preventDefault = true;

        if (e.key === " ") {
            // setClue(rowIndex, tileIndex, nextClue(clue));
        } else if (e.key === "Tab") {
            if (e.shiftKey) {
                left();
            } else {
                right();
            }
        } else if (e.key === "ArrowLeft") {
            left();
        } else if (e.key === "ArrowRight") {
            right();
        } else if (e.key === "Backspace") {
            if (!char) {
                left();
            } else {
                setChar(rowIndex, tileIndex, "");
            }
        } else if (e.key === "ArrowUp") {
            up();
        } else if (e.key === "ArrowDown") {
            down();
        } else if (e.key === "Delete") {
            setChar(rowIndex, tileIndex, "");
        } else if (e.key === "Enter") {
            submit();
        } else if (e.key === "Home") {
            setTile(rowIndex, 0);
        } else if (e.key === "End") {
            setTile(rowIndex, WORD_LENGTH - 1);
        } else {
            preventDefault = false;
        }

        if (preventDefault) {
            e.preventDefault();
        }
    };

    const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        setTile(rowIndex, tileIndex);
    };

    return (
        <input
            type="text"
            className={"tile " + "tile-" + clue}
            ref={ref}
            onChange={onChange}
            onKeyDown={onKeyDown}
            onFocus={onFocus}
            value={char}
            placeholder={guess || ""}
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

function nextClue(clue: string): string {
    if (clue === CLUE_NONE) {
        return CLUE_RIGHT;
    } else if (clue === CLUE_RIGHT) {
        return CLUE_MISPLACED;
    } else if (clue === CLUE_MISPLACED) {
        return CLUE_WRONG;
    }
    return CLUE_NONE;
}
