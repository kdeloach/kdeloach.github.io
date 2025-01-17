#!/usr/bin/env python3
import re
import json


def get_words_from_wordlist(wordlist_path):
    words = set()
    with open(wordlist_path, "r") as file:
        for line in file:
            # Remove punctuation and split the line into words
            word = re.sub(r"[^a-z]", "", line.lower())
            if len(word) >= 3 and len(word) <= 5:
                words.add(word)
    sorted_words = sorted(list(words))  # Sorting the list for consistent output order
    return {w: 1 for w in sorted_words}


def save_to_json(words, output_file):
    with open(output_file, "w") as file:
        json.dump(words, file)


if __name__ == "__main__":
    wordlist_path = "/usr/share/dict/american-english"  # Path to the wordlist on Ubuntu
    output_file = "src/words.json"  # Output JSON file

    filtered_words = get_words_from_wordlist(wordlist_path)
    save_to_json(filtered_words, output_file)
    print("Filtered words saved to", output_file)
