#!/bin/bash

docker run -it --rm \
    -v "$PWD":/srv/jekyll \
    github-pages \
    jekyll doctor

# Spellcheck
mdspell --en-us --ignore-numbers --ignore-acronyms --report \
    "**/*.md" "!**/node_modules/**/*.md"
