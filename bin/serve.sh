#!/bin/bash

docker run -it --rm \
    -v "$PWD":/usr/src/app \
    -p "4000:4000" \
    -p "35729:35729" \
    github-pages \
    jekyll serve -d /_site --livereload --livereload-port 35729 --host 0.0.0.0 --port 4000 --drafts
