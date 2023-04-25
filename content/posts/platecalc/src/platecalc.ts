export class TreeNode {
    value: number;
    parent: TreeNode | null;
    children: { [key: number]: TreeNode };
    totalValue: number;

    constructor(value: number = 0, parent: TreeNode | null = null) {
        this.value = value;
        this.parent = parent;
        this.children = {};
        this.totalValue = this.value + (this.parent?.totalValue ?? 0);
    }

    find(...values: number[]): TreeNode | null {
        var result: TreeNode | undefined = this;
        while (values.length) {
            result = result.getChild(values.shift());
            if (!result) {
                return null;
            }
        }
        return result;
    }

    hasChild(value: number): boolean {
        return value in this.children;
    }

    getChild(value: number): TreeNode | undefined {
        return this.children[value];
    }

    addChild(value: number): TreeNode {
        const child = new TreeNode(value, this);
        this.children[value] = child;
        return child;
    }

    getNodesWithTotalValue(barWeight: number, totalValue: number) {
        const results: TreeNode[] = [];
        const n = (totalValue - barWeight) / 2;
        this.walkDFS((node) => {
            if (node.totalValue === n) {
                results.push(node);
            }
        });

        return results;
    }

    walkDFS(callback: (node: TreeNode) => void) {
        callback(this);
        for (const childKey in this.children) {
            const child = this.children[childKey];
            child.walkDFS(callback);
        }
    }

    nodes(): ValueNode[] {
        // Find path from current node to parent
        const nodes: TreeNode[] = [];
        let currentNode: TreeNode = this;
        while (currentNode.parent) {
            nodes.push(currentNode);
            currentNode = currentNode.parent;
        }

        // Create ValueNodes from parent to current node, so that the key
        // counter increments from left to right, to make it easier to compare
        // sorted sublists. Lists with duplicate plates should be ordered like:
        // [10-0, 10-1, 5-0, 5-1, etc.]
        const path: ValueNode[] = [];
        const counter: Record<number, number> = {};
        while (nodes.length) {
            const currentNode = nodes.pop();
            const count = counter[currentNode.value] || 0;
            counter[currentNode.value] = count + 1;
            const key = `${currentNode.value}-${count}`;
            path.push(new ValueNode(currentNode.value, key));
        }
        return path;
    }

    toString(): string {
        return ValueNodeUtil.toString(this.nodes());
    }
}

// ValueNode represents a TreeNode without the parent/child relationships which
// are not relevant after sorting the nodes. The key field is used to
// differentiate between 2 nodes of the same value between sets.
export class ValueNode {
    value: number;
    key: string;

    constructor(value: number, key: string) {
        this.value = value;
        this.key = key;
    }

    equals(other: ValueNode): boolean {
        return other.key === this.key;
    }

    valueEquals(other: ValueNode): boolean {
        return other.value === this.value;
    }
}

export class ValueNodeUtil {
    static distance(a: ValueNode[], b: ValueNode[]): number {
        const n = Math.min(a.length, b.length);
        let i = 0;
        while (i < n && a[i].equals(b[i])) {
            i++;
        }
        const dist = a.length + b.length - i * 2;
        // console.log(this.toString(a), this.toString(b), dist);
        return dist;
    }

    static score(nodes: ValueNode[]): number {
        let totalScore = 0;
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            const height = i + 1;
            totalScore += Math.round(node.value * height);
        }
        return totalScore;
    }

    static toString(nodes: ValueNode[]): string {
        return "[" + nodes.map((node) => node.value).join(", ") + "]";
    }
}

export function distinctSubsets(numbers: number[]): number[][] {
    const subsets: number[][] = [];

    const generateSubsets = (currentSubset: number[], startIndex: number) => {
        if (startIndex > 0) {
            subsets.push([...currentSubset]);
        }
        for (let i = startIndex; i < numbers.length; i++) {
            if (i > startIndex && numbers[i] === numbers[i - 1]) {
                continue;
            }
            currentSubset.push(numbers[i]);
            generateSubsets(currentSubset, i + 1);
            currentSubset.pop();
        }
    };

    generateSubsets([], 0);
    return subsets;
}

export function tuplesToTree(tuples: number[][]): TreeNode {
    const root = new TreeNode(0);

    tuples.forEach((tuple) => {
        let parent = root;

        tuple.forEach((value) => {
            if (parent.hasChild(value)) {
                parent = parent.getChild(value)!;
            } else {
                parent = parent.addChild(value);
            }
        });
    });

    return root;
}

export function sortByFrequency(arr: ValueNode[][]) {
    // Create an object to store the frequency of each key
    const freqMap: Record<string, number> = {};

    arr.forEach((subArr, i) => {
        subArr.forEach((node) => {
            if (freqMap[node.key]) {
                freqMap[node.key]++;
            } else {
                freqMap[node.key] = 1;
            }
        });
    });

    // Sort the subarrays based on the frequency of their keys
    arr.forEach((subArr, i) => {
        subArr.sort((a, b) => {
            if (freqMap[b.key] !== freqMap[a.key]) {
                return freqMap[b.key] - freqMap[a.key];
            } else if (i > 0) {
                // Prefer not to move plates from previous set, for plates
                // with equal frequencies.
                const indexA = arr[i - 1].findIndex((node) => node.equals(a));
                const indexB = arr[i - 1].findIndex((node) => node.equals(b));
                if (indexA === -1) return 1; // Move a to the end of the array if not found in the previous subarray
                if (indexB === -1) return -1; // Move b to the end of the array if not found in the previous subarray
                return indexA - indexB;
            }
            return 0;
        });
    });
}

export function sortFrontToBack(arr: ValueNode[][]) {
    sortByFirst(arr);
    sortByLast(arr);
}

export function sortBackToFront(arr: ValueNode[][]) {
    sortByLast(arr);
    sortByFirst(arr);
}

export function sortByFirst(arr: ValueNode[][]) {
    // Sort each subarray by the previous subarray in ascending order
    for (let i = 1; i < arr.length; i++) {
        arr[i].sort((a, b) => {
            const indexA = arr[i - 1].findIndex((node) => node.equals(a));
            const indexB = arr[i - 1].findIndex((node) => node.equals(b));
            if (indexA === -1) return 1; // Move a to the end of the array if not found in the previous subarray
            if (indexB === -1) return -1; // Move b to the end of the array if not found in the previous subarray
            return indexA - indexB;
        });
    }
}

export function sortByLast(arr: ValueNode[][]) {
    // Sort each subarray by the next subarray in ascending order
    for (let i = arr.length - 2; i >= 0; i--) {
        arr[i].sort((a, b) => {
            const indexA = arr[i + 1].findIndex((node) => node.equals(a));
            const indexB = arr[i + 1].findIndex((node) => node.equals(b));
            if (indexA === -1) return 1; // Move a to the end of the array if not found in the next subarray
            if (indexB === -1) return -1; // Move b to the end of the array if not found in the next subarray
            return indexA - indexB;
        });
    }
}

function calculateTotalScore(nodes: TreeNode[]): number {
    if (nodes.length === 0) {
        return 0;
    }

    const valueNodesUnsorted = nodes.map((node) => node.nodes());

    const valueNodes = nodes.map((node) => node.nodes());
    sortFrontToBack(valueNodes);

    // const debugTable = [];

    let totalDist = valueNodes[0].length;
    let totalPlates = valueNodes[0].length;
    let prevScore = ValueNodeUtil.score(valueNodes[0]);
    let totalScore = prevScore * totalDist;

    // debugTable.push([
    //     ValueNodeUtil.toString(valueNodesUnsorted[0]),
    //     ValueNodeUtil.toString(valueNodes[0]),
    //     `score=${prevScore} dist=${totalDist}`,
    // ]);

    for (let i = 1; i < valueNodes.length; i++) {
        const prevNode = valueNodes[i - 1];
        const currNode = valueNodes[i];

        const dist = ValueNodeUtil.distance(prevNode, currNode);
        const score = ValueNodeUtil.score(currNode);
        const scoreDelta = Math.abs(score - prevScore);

        // debugTable.push([
        //     ValueNodeUtil.toString(valueNodesUnsorted[i]),
        //     ValueNodeUtil.toString(currNode),
        //     `score=${scoreDelta} dist=${dist}`,
        // ]);

        totalDist += dist;
        totalPlates += currNode.length;
        totalScore += scoreDelta * dist;

        prevScore = score;
    }

    // debugTable.push(["", `total=${totalScore} dist=${totalDist} plates=${totalPlates}`]);
    // console.table(debugTable);

    // Multiply final score by total number of plates added/removed as a tie
    // breaker between solutions with equal scores.
    return totalScore * totalDist;
}

function walkCombinations<T>(inputs: T[][], callback: (args: T[]) => void) {
    if (inputs.length === 0) {
        callback([]);
        return;
    }

    function recurse(depth: number, args: T[]) {
        if (depth === inputs.length) {
            callback(args);
            return;
        }

        const currentInput = inputs[depth];
        for (let i = 0; i < currentInput.length; i++) {
            const currentArg = currentInput[i];
            recurse(depth + 1, [...args, currentArg]);
        }
    }

    recurse(0, []);
}

export function findLowestScore(nodesList: TreeNode[][]): TreeNode[] | undefined {
    let lowestScore = Infinity;
    let lowestNodes: TreeNode[] | undefined;
    walkCombinations(nodesList, (nodes) => {
        const score = calculateTotalScore(nodes);
        if (score < lowestScore) {
            lowestScore = score;
            lowestNodes = nodes;
        }
    });
    return lowestNodes;
}

export function parseNumbersFromString(inputString: string): number[] {
    const regex = /[^0-9\.]+/g;
    const cleanedString = inputString.replace(regex, " ");
    const numbers = cleanedString
        .split(" ")
        .map((s) => parseFloat(s))
        .filter((n) => !isNaN(n));
    return numbers;
}

interface Summary {
    platesAddedRemoved: number;
    totalWeightAddedRemoved: number;
}

export function summarizeDifference(arr: ValueNode[][]): Summary {
    if (arr.length === 0) {
        return {
            platesAddedRemoved: 0,
            totalWeightAddedRemoved: 0,
        };
    }

    const added: ValueNode[] = [...arr[0]];
    const removed: ValueNode[] = [...arr[arr.length - 1]];

    for (let i = 1; i < arr.length; i++) {
        // Previous and current sublist
        const prev = arr[i - 1];
        const curr = arr[i];

        // Find longest common prefix
        const n = Math.min(prev.length, curr.length);
        let j = 0;
        while (j < n && prev[j].valueEquals(curr[j])) {
            j++;
        }

        // Find added/removed plates in current sublist
        for (; j < curr.length; j++) {
            const prevNode = prev[j];
            const currNode = curr[j];
            if (!prevNode) {
                // If there's no node at this index in the previous sublist
                // then the current sublist must be longer so we can mark the
                // remaining nodes as added.
                added.push(currNode);
            } else if (!prevNode.valueEquals(currNode)) {
                // If the node at this index in the previous sublist doesn't
                // match then it must have been removed.
                removed.push(prevNode);
                added.push(currNode);
            }
        }

        // Find removed plates from previous sublist
        for (; j < prev.length; j++) {
            // If the previous sublist is longer than the current sublist then
            // those plates must have been removed.
            const prevNode = prev[j];
            removed.push(prevNode);
        }
    }

    const platesAddedRemoved = added.length + removed.length;

    const weightAdded = added.map((node) => node.value);
    const weightRemoved = removed.map((node) => node.value);
    const totalWeightAddedRemoved = [...weightAdded, ...weightRemoved].reduce((acc, n) => acc + n, 0);

    return { platesAddedRemoved, totalWeightAddedRemoved };
}
