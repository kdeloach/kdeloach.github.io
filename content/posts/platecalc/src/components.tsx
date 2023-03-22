import React, { useState, useMemo } from "react";
import {
    TreeNode,
    parseInputString,
    distinctSubsets,
    tuplesToTree,
    findLowestScore,
    sortArrayByNeighbor,
    formatTreeNodeArr,
} from "./platecalc";

export const PlatecalcForm = () => {
    const [platesInput, setPlatesInput] = useState("45, 35, 25, 10, 10, 5, 5, 2.5");

    const plates = useMemo(() => {
        const plates = parseInputString(platesInput);
        plates.sort((a, b) => b - a);
        return plates;
    }, [platesInput]);

    const tree = useMemo(() => {
        const tuples = distinctSubsets(plates);
        return tuplesToTree(tuples);
    }, [plates]);

    const [weightsInput, setWeightsInput] = useState("");
    const weights = parseInputString(weightsInput);
    const inputNodes = weights.map((n) => tree.getNodesWithTotalValue(n));
    const ans = findLowestScore(inputNodes) || [];
    const expanded: TreeNode[][] = ans.map((node) => node.nodes());
    const sortedAns = sortArrayByNeighbor(expanded);

    return (
        <>
            <div>
                Plates: <input type="text" value={platesInput} onChange={(e) => setPlatesInput(e.target.value)} />
            </div>
            <div>
                Weights: <input type="text" value={weightsInput} onChange={(e) => setWeightsInput(e.target.value)} />
            </div>
            <div>
                {(sortedAns.length && (
                    <ol>
                        {sortedAns.map((arr, i) => (
                            <li key={i}>{formatTreeNodeArr(arr)}</li>
                        ))}
                    </ol>
                )) ||
                    "No Solution"}
            </div>
        </>
    );
};
