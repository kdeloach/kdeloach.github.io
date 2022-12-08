#!/bin/bash

user=$(id -u):$(id -g)

docker-compose run --rm --user ${user} -e NODE_ENV=production webpack build

docker-compose run --rm --user ${user} hugo hugo

# docker-compose run --rm --user ${user} --entrypoint node webpack ./bin/post-build.js
