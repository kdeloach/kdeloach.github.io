#!/bin/bash

set -ex

CGO_ENABLED=0 go run ./scripts/server.go -port 8081
