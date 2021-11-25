#!/bin/bash

docker run --rm \
    -v "$PWD":/usr/src/app \
    --entrypoint jekyll \
    github-pages \
    doctor

# Spellcheck
mdspell --en-us --ignore-numbers --ignore-acronyms --report "**/*.md"
