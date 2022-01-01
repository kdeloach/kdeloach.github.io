#!/bin/bash

docker-compose run --rm jekyll doctor

# Spellcheck
mdspell --en-us --ignore-numbers --ignore-acronyms --report \
    "**/*.md" "!**/node_modules/**/*.md"
