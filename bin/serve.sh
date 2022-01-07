#!/bin/bash

docker-compose up

./bin/hugo server -D --bind 0.0.0.0 --baseURL http://192.168.1.20:1313/
