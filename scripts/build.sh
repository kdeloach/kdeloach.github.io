#!/bin/bash

set -ex

cd ./mdsite && go run ./mdsite.go ../

yarn tailwindcss -o style.css
