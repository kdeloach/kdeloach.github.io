#!/bin/bash

set -ex

cd ./mdsite && go run ./mdsite.go ../

yarn tailwindcss -i style.css -o tailwind.css
