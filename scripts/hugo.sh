#!/bin/bash

user=$(id -u):$(id -g)

docker-compose run --rm --user ${user} hugo hugo "$@"