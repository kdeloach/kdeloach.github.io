#!/bin/bash

user=$(id -u):$(id -g)

docker-compose run --rm --user ${user} jekyll build

docker-compose run --rm --user ${user} webpack build
