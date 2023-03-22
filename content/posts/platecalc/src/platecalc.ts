export class TreeNode {
    value: number;
    parent: TreeNode | null;
    children: { [key: number]: TreeNode };
    totalValue: number;
    height: number;
    score: number;
    scoreLight: number;

    constructor(value: number = 0, parent: TreeNode | null = null) {
        this.value = value;
        this.parent = parent;
        this.children = {};
        this.totalValue = this.value + (this.parent?.totalValue ?? 0);
        this.height = (this.parent?.height ?? -1) + 1;

        const scale = Math.round(value / 10);

        this.score = (this.parent?.score ?? 0) + Math.round(this.value * this.height);
        this.scoreLight = (this.parent?.scoreLight ?? 0) + Math.round(this.value * this.height * scale);
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

    distanceTo(otherNode: TreeNode | null) {
        if (otherNode === null) {
            throw new Error("The specified node is null");
        }

        let currentNode: TreeNode | null = this;
        let distance = 0;

        while (currentNode !== null && otherNode !== null && currentNode !== otherNode) {
            if (currentNode.height > otherNode.height) {
                currentNode = currentNode.parent;
                distance++;
            } else if (currentNode.height < otherNode.height) {
                otherNode = otherNode.parent;
                distance++;
            } else {
                currentNode = currentNode.parent;
                otherNode = otherNode.parent;
                distance += 2;
            }
        }

        if (currentNode === null || otherNode === null) {
            throw new Error("The specified nodes are not in the same tree");
        }

        return distance;
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

    values(): number[] {
        return this.nodes().map((node) => node.value);
    }

    toString(): string {
        return `[${this.values()}]`;
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

class ValueNodeUtil {
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

    static toString(a: ValueNode[]): string {
        return "[" + a.map((node) => node.value).join(",") + "]";
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

// TODO: delete, not used
function distinctSubsetsAndPermutations(numbers: number[]): number[][] {
    const subsetsAndPermutations: number[][] = [];

    const generateSubsetsAndPermutations = (currentSubset: number[], startIndex: number, used: boolean[]) => {
        if (startIndex > 0) {
            subsetsAndPermutations.push([...currentSubset]);
        }

        for (let i = startIndex; i < numbers.length; i++) {
            if (used[i] || (i > startIndex && numbers[i] === numbers[i - 1] && !used[i - 1])) {
                continue;
            }

            used[i] = true;
            currentSubset.push(numbers[i]);

            generateSubsetsAndPermutations(currentSubset, startIndex, used);

            for (let j = startIndex; j < i; j++) {
                if (!used[j]) {
                    used[j] = true;
                    currentSubset.push(numbers[j]);
                    generateSubsetsAndPermutations(currentSubset, i, used);
                    currentSubset.pop();
                    used[j] = false;
                }
            }

            currentSubset.pop();
            used[i] = false;
        }
    };

    generateSubsetsAndPermutations([], 0, new Array(numbers.length).fill(false));

    return subsetsAndPermutations;
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

// Test case: 100 150 200 250
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

    // Sort the subarrays based on the frequency of their keys and first index
    arr.forEach((subArr, i) => {
        subArr.sort((a, b) => {
            if (freqMap[b.key] !== freqMap[a.key]) {
                return freqMap[b.key] - freqMap[a.key];
            } else if (i > 0) {
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

// TODO: test 100 200 125

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

function prettyPrintTree(root: TreeNode, path: (number | string)[] = []): string {
    const value = root.value !== undefined && root.value !== null ? root.value : "root";
    const result = [`- ${path.length === 0 ? value : `[${path.concat(+value || 0).join(", ")}]`}`];
    const children = Object.values(root.children);
    children.forEach((child) => {
        const childPath = [...path, value];
        result.push(...prettyPrintTree(child, childPath).split("\n"));
    });
    return result.join("\n");
}

export function formatTreeNodeArr(arr: TreeNode[]): string {
    return "[" + arr.map((node) => node.value).join(", ") + "]";
}

function calculateTotalScore(nodes: TreeNode[], preferLight: boolean): number {
    if (nodes.length === 0) {
        return 0;
    }

    const score = (node: TreeNode): number => (preferLight ? node.scoreLight : node.score);

    let totalScore = score(nodes[0]);
    for (let i = 1; i < nodes.length; i++) {
        const prevNode = nodes[i - 1];
        const currNode = nodes[i];

        const sorted = [prevNode.nodes(), currNode.nodes()];
        sortByFrequency(sorted);
        const dist = ValueNodeUtil.distance(sorted[0], sorted[1]);

        const score = (preferLight ? currNode.scoreLight : currNode.score) * dist;
        //console.log(prevNode.toString(), currNode.toString(), dist, score);
        totalScore += score;
    }
    return totalScore;
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

export function findLowestScore(nodesList: TreeNode[][], preferLight: boolean): TreeNode[] | undefined {
    let lowestScore = Infinity;
    let lowestNodes: TreeNode[] | undefined;
    walkCombinations(nodesList, (nodes) => {
        const score = calculateTotalScore(nodes, preferLight);
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
    const removed: ValueNode[] = [];

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
