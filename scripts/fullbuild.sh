#!/bin/bash

set -ex

./scripts/build.sh

find . -type f -name "webpack.config.js" -exec dirname {} \; | xargs -I {} ./scripts/bundle.sh {}
