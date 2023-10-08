import React, { MouseEvent, useState, useMemo } from "react";
import {
    TreeNode,
    ValueNode,
    parseNumbersFromString,
    distinctSubsets,
    tuplesToTree,
    findLowestScore,
    calculateTotalScore,
    sortByFirst,
    sortByLast,
    sortByFrequency,
    ValueNodeUtil,
    sortFrontToBack,
    sortBackToFront,
    summarizeDifference,
} from "./platecalc";

type SortMethod = "first" | "last" | "frontToBack" | "backToFront" | "frequency" | "none";

export const PlateCalcForm = () => {
    const [barWeight, setBarWeight] = useState(45);
    const [sortMethod, setSortMethod] = useState<SortMethod>("frontToBack");
    const [platesInput, setPlatesInput] = useState("45, 35, 25, 10, 10, 5, 5, 2.5, 1.25");

    const plates = useMemo(() => {
        const plates = parseNumbersFromString(platesInput);
        plates.sort((a, b) => b - a);
        return plates;
    }, [platesInput]);

    const tree = useMemo(() => {
        const tuples = distinctSubsets(plates);
        return tuplesToTree(tuples);
    }, [plates]);

    // XXX for debugging
    (window as any).tree = tree;
    (window as any).ValueNodeUtil = ValueNodeUtil;
    (window as any).ValueNode = ValueNode;
    (window as any).calculateTotalScore = calculateTotalScore;

    const [weightsInput, setWeightsInput] = useState("100 150 200 120");
    const weights = parseNumbersFromString(weightsInput);

    const candidates = weights.map((n) => tree.getNodesWithTotalValue(barWeight, n));
    const setNodes = findLowestScore(candidates) || [];
    const result: ValueNode[][] = setNodes.map((node) => node.nodes());

    if (sortMethod == "frontToBack") {
        sortFrontToBack(result);
    } else if (sortMethod == "backToFront") {
        sortBackToFront(result);
    } else if (sortMethod == "first") {
        sortByFirst(result);
    } else if (sortMethod == "last") {
        sortByLast(result);
    } else if (sortMethod == "frequency") {
        sortByFrequency(result);
    }

    const sortMethods: { label: string; value: SortMethod; help: string }[] = [
        {
            label: "First to Last",
            value: "frontToBack",
            help: "Sort by First then Last Set. Prefer position of plates from later sets.",
        },
        {
            label: "Last to First",
            value: "backToFront",
            help: "Sort by Last then First Set. Prefer position of plates from earlier sets.",
        },
        {
            label: "First Set",
            value: "first",
            help: "Prefer position of plates from earlier sets.",
        },
        {
            label: "Last Set",
            value: "last",
            help: "Prefer position of plates from later sets.",
        },
        {
            label: "Frequency",
            value: "frequency",
            help: "Sort plates by occurrence across all sets.",
        },
        { label: "Weight", value: "none", help: "Sort from heavy to light. This is typically the worst option." },
    ];

    const values = (result.length && result.flatMap((arr) => arr.map((node) => node.value))) || [];
    const minValue = Math.floor(Math.min(...values));
    const maxValue = Math.ceil(Math.max(...values));

    const summary = summarizeDifference(result);

    return (
        <>
            <div className="form">
                <div className="form-item">
                    <label htmlFor="weights">Weights:</label>
                    <input
                        id="weights"
                        type="text"
                        className="large-input"
                        value={weightsInput}
                        onChange={(e) => setWeightsInput(e.target.value)}
                    />
                </div>
                <div className="form-item">
                    <label htmlFor="plates">Plates:</label>
                    <input
                        id="plates"
                        type="text"
                        className="small-input"
                        value={platesInput}
                        onChange={(e) => setPlatesInput(e.target.value)}
                    />
                </div>
                <div className="form-item">
                    <label htmlFor="barWeight">Bar Weight:</label>
                    <input
                        id="barWeight"
                        type="number"
                        className="small-input"
                        value={barWeight}
                        onChange={(e) => setBarWeight(parseFloat(e.target.value) || 0)}
                    />
                </div>
                <div className="form-item">
                    <label>Sort By:</label>
                    <div className="sort-options">
                        {sortMethods.map(({ label, value, help }, i) => (
                            <label key={i} title={help}>
                                <input
                                    type="radio"
                                    checked={sortMethod === value}
                                    onChange={() => setSortMethod(value)}
                                />
                                {label}
                            </label>
                        ))}
                    </div>
                </div>
            </div>
            <div className="summary">
                <div>Plates added/removed: {summary.platesAddedRemoved}</div>
                <div>Total weight added/removed: {summary.totalWeightAddedRemoved}</div>
            </div>
            <div className="result">
                {(result.length &&
                    result.map((arr, i) => (
                        <Plates key={i} barWeight={barWeight} plates={arr} minValue={minValue} maxValue={maxValue} />
                    ))) ||
                    "No Solution"}
            </div>
            <div className="candidates">
                <table width="100%">
                    <thead>
                        <tr>
                            <th>Weight</th>
                            <th>Plates</th>
                        </tr>
                    </thead>
                    {weights.map((n, i) => (
                        <tbody key={i}>
                            <tr>
                                <th rowSpan={candidates[i].length + 1}>{n}</th>
                            </tr>
                            {candidates[i].map((node, i) => (
                                <tr key={i}>
                                    <td>{node.toString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    ))}
                </table>
            </div>
            <div className="help">
                <h3>Sort Options</h3>
                <dl>
                    {sortMethods.map(({ label, help }, i) => (
                        <React.Fragment key={i}>
                            <dt>{label}</dt>
                            <dd>{help}</dd>
                        </React.Fragment>
                    ))}
                </dl>
            </div>
        </>
    );
};

const PLATE_COLORS: { [key: number]: string } = {
    55: "red",
    45: "blue",
    35: "yellow",
    25: "green",
    10: "white",
    5: "blue",
    2.5: "green",
    1.25: "white",
};

interface PlatesProps {
    barWeight: number;
    plates: ValueNode[];
    minValue: number;
    maxValue: number;
}
const Plates = ({ barWeight, plates, minValue, maxValue }: PlatesProps) => {
    const values = plates.map((node) => node.value);
    const totalValue = plates.reduce((acc: number, plate: ValueNode) => acc + plate.value, 0);

    const minHeight = 50;
    const maxHeight = 100;
    const calcHeight = (n: number) => scale(normalize(n, minValue, maxValue) || 0, minHeight, maxHeight);
    const barWidth = 50 * plates.length + 25;
    const totalWeight = barWeight + totalValue * 2;

    const copyToClipboard = (e: MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        navigator.clipboard.writeText(values.join(", "));
    };

    return (
        <div className="plates">
            {values.map((n, i) => (
                <div className={`plate ${PLATE_COLORS[n] || ""}`} key={i} style={{ height: calcHeight(n) }}>
                    {n}
                </div>
            ))}
            <div className="bar" style={{ width: barWidth }}></div>
            <div className="spacer"></div>
            <div>
                <span>{totalWeight} lbs</span>{" "}
                <a href="#" onClick={copyToClipboard} style={{ textDecoration: "none" }} title="Copy to clipboard">
                    &#128203;
                </a>
            </div>
        </div>
    );
};

function scale(normalized: number, min: number, max: number): number {
    return Math.round(min + normalized * (max - min));
}

function normalize(n: number, lo: number, hi: number): number {
    if (n < lo) {
        return lo;
    }
    if (n > hi) {
        return hi;
    }
    return (n - lo) / (hi - lo);
}
