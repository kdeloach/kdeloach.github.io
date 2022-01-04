#!/bin/bash

docker run -it --rm \
    -v "$PWD":/usr/src/app \
    github-pages \
    jekyll build
