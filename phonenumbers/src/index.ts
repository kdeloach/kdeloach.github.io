import validWords from './words.json'

// Define function to generate words from a phone number
function generateWords(phoneNumber: string): string[] {
    // Mapping of digits to possible letters
    const digitToLetters: { [key: string]: string[] } = {
        "2": ["a", "b", "c"],
        "3": ["d", "e", "f"],
        "4": ["g", "h", "i"],
        "5": ["j", "k", "l"],
        "6": ["m", "n", "o"],
        "7": ["p", "q", "r", "s"],
        "8": ["t", "u", "v"],
        "9": ["w", "x", "y", "z"],
    };

    // Recursive function to generate words
    function generateWordsRecursive(prefix: string, remainingDigits: string): string[] {
        if (remainingDigits.length === 0) {
            return [prefix];
        }

        const currentDigit = remainingDigits[0];
        const letters = digitToLetters[currentDigit] || [];
        const restDigits = remainingDigits.slice(1);
        const result: string[] = [];

        for (const letter of letters) {
            const words = generateWordsRecursive(prefix + letter, restDigits)
            result.push(...words);
        }

        return result;
    }

    return generateWordsRecursive("", phoneNumber);
}

// Define function to generate phone numbers from a word
function generatePhoneNumbers(word: string): string[] {
    // Mapping of letters to corresponding digits
    const letterToDigit: { [key: string]: string } = {
        a: "2",
        b: "2",
        c: "2",
        d: "3",
        e: "3",
        f: "3",
        g: "4",
        h: "4",
        i: "4",
        j: "5",
        k: "5",
        l: "5",
        m: "6",
        n: "6",
        o: "6",
        p: "7",
        q: "7",
        r: "7",
        s: "7",
        t: "8",
        u: "8",
        v: "8",
        w: "9",
        x: "9",
        y: "9",
        z: "9",
    };

    // Function to convert a word to phone number
    function wordToPhoneNumber(word: string): string {
        return word
            .split("")
            .map((letter) => letterToDigit[letter])
            .join("");
    }

    return [wordToPhoneNumber(word)];
}

// Get DOM elements
const phoneNumberInput = document.getElementById("phoneNumber") as HTMLInputElement;
const wordsList = document.getElementById("words") as HTMLUListElement;

const wordInput = document.getElementById("word") as HTMLInputElement;
const phoneNumbersList = document.getElementById("phoneNumbers") as HTMLUListElement;

// Event listeners for inputs
phoneNumberInput.addEventListener("input", () => {
    const phoneNumber = phoneNumberInput.value;
    const words = generateWords(phoneNumber);

    // Clear previous list items
    wordsList.innerHTML = "";

    // Append new list items
    words.forEach((word) => {
        const listItem = document.createElement("li");
        listItem.textContent = word;
        wordsList.appendChild(listItem);
    });
});

wordInput.addEventListener("input", () => {
    const word = wordInput.value;
    const phoneNumbers = generatePhoneNumbers(word);

    // Clear previous list items
    phoneNumbersList.innerHTML = "";

    // Append new list items
    phoneNumbers.forEach((phoneNumber) => {
        const listItem = document.createElement("li");
        listItem.textContent = phoneNumber;
        phoneNumbersList.appendChild(listItem);
    });
});
