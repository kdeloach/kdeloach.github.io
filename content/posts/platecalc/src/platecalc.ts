export class TreeNode {
    value: number;
    parent: TreeNode | null;
    children: { [key: number]: TreeNode };
    totalValue: number;
    height: number;
    score: number;

    constructor(value: number = 0, parent: TreeNode | null = null) {
        this.value = value;
        this.parent = parent;
        this.children = {};
        this.totalValue = this.value + (this.parent?.totalValue ?? 0);
        this.height = (this.parent?.height ?? -1) + 1;

        const scale = 1;
        // to prefer lighter plates
        // let scale = Math.floor(Math.round(value / 10));
        // if (scale < 1) {
        //   scale = 1;
        // }

        this.score = (this.parent?.score ?? 0) + this.value * this.height * scale;
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

    getNodesWithTotalValue(totalValue: number) {
        // XXX
        totalValue -= 45;
        totalValue /= 2;

        const results: TreeNode[] = [];

        this.walkDFS((node) => {
            if (node.totalValue === totalValue) {
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

    nodes(): TreeNode[] {
        const path: TreeNode[] = [];
        let currentNode: TreeNode = this;
        while (currentNode.parent) {
            path.unshift(currentNode);
            currentNode = currentNode.parent;
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

// TODO: delete
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

class WrappedTreeNode {
    node: TreeNode;
    key: string;

    constructor(node: TreeNode, key: string) {
        this.node = node;
        this.key = key;
    }
}

// TODO: delete
function sortArrayByFrequency(arr: TreeNode[][]): TreeNode[][] {
    const wrap = (node: TreeNode, key: string) => new WrappedTreeNode(node, key);
    const unwrap = (wrapped: WrappedTreeNode) => wrapped.node;

    const wrappedArr: WrappedTreeNode[][] = [];
    arr.forEach((subArr) => {
        const counter: Record<number, number> = {};
        wrappedArr.push(
            subArr.map((node) => {
                const count = counter[node.value] || 0;
                counter[node.value] = count + 1;
                return wrap(node, `${node.value}-${count}`);
            })
        );
    });

    // Create an object to store the frequency of each number
    const freqMap: Record<string, number> = {};
    wrappedArr.forEach((subArr) => {
        subArr.forEach((node) => {
            if (freqMap[node.key]) {
                freqMap[node.key]++;
            } else {
                freqMap[node.key] = 1;
            }
        });
    });

    // Sort the subarrays based on the frequency of their numbers
    wrappedArr.forEach((subArr) => {
        subArr.sort((a, b) => freqMap[b.key] - freqMap[a.key]);
    });

    return wrappedArr.map((subArr) => subArr.map((node) => unwrap(node)));
}

export function sortArrayByNeighbor(arr: TreeNode[][]): TreeNode[][] {
    if (arr.length <= 1) {
        return arr;
    }

    const wrap = (node: TreeNode, key: string) => new WrappedTreeNode(node, key);
    const unwrap = (wrapped: WrappedTreeNode) => wrapped.node;
    const exists = (haystack: WrappedTreeNode[], needle: WrappedTreeNode) =>
        !haystack.every((node) => node.key !== needle.key);

    const wrappedArr: WrappedTreeNode[][] = [];
    arr.forEach((subArr) => {
        const counter: Record<number, number> = {};
        wrappedArr.push(
            subArr.map((node) => {
                const count = counter[node.value] || 0;
                counter[node.value] = count + 1;
                return wrap(node, `${node.value}-${count}`);
            })
        );
    });

    // odd: 100 200 125
    let j = 0;

    // needed?
    while (j++ < 3) {
        // First pass: sort each subarray by the previous subarray in ascending order
        for (let i = 1; i < wrappedArr.length; i++) {
            wrappedArr[i].sort((a, b) => {
                const indexA = wrappedArr[i - 1].findIndex((node) => node.key === a.key);
                const indexB = wrappedArr[i - 1].findIndex((node) => node.key === b.key);
                if (indexA === -1) return 1; // Move a to the end of the array if not found in the previous subarray
                if (indexB === -1) return -1; // Move b to the end of the array if not found in the previous subarray
                return indexA - indexB;
            });
        }

        // Second pass: sort each subarray by the next subarray in ascending order
        for (let i = wrappedArr.length - 2; i >= 0; i--) {
            wrappedArr[i].sort((a, b) => {
                const indexA = wrappedArr[i + 1].findIndex((node) => node.key === a.key);
                const indexB = wrappedArr[i + 1].findIndex((node) => node.key === b.key);
                if (indexA === -1) return 1; // Move a to the end of the array if not found in the next subarray
                if (indexB === -1) return -1; // Move b to the end of the array if not found in the next subarray
                return indexA - indexB;
            });
        }
    }

    return wrappedArr.map((subArr) => subArr.map((node) => unwrap(node)));
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

function calculateTotalScore(nodes: TreeNode[]): number {
    if (nodes.length === 0) {
        return 0;
    }
    let totalScore = 0;
    for (let i = 1; i < nodes.length; i++) {
        const prevNode = nodes[i - 1];
        const currNode = nodes[i];
        const distance = prevNode.distanceTo(currNode);
        totalScore += currNode.score * distance;
    }
    return totalScore + nodes[0].score;
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

export function parseInputString(inputString: string): number[] {
    const items = inputString.split(" "); // Step 1
    const digitsOnly = items.map((item) => item.replace(/[^0-9.]/g, "")); // Step 2
    const numbers = digitsOnly.map((item) => parseFloat(item)); // Step 3
    return numbers.filter((number) => !isNaN(number)); // Step 4
}
