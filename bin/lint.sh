#!/bin/bash
docker run --rm -v "$PWD":/usr/src/app --entrypoint jekyll starefossen/github-pages doctor
