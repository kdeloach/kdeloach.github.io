#!/bin/bash

# Spellcheck
mdspell --en-us --ignore-numbers --ignore-acronyms --report \
    "**/*.md" "!**/node_modules/**/*.md"

prettier -c ./
