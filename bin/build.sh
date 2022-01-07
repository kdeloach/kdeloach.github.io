#!/bin/bash

docker run --rm \
    -v "$PWD":/srv/jekyll \
    --user $(id -u):$(id -g) \
    github-pages \
    jekyll build
