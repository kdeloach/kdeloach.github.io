#!/bin/bash

set -ex

NODE_ENV=${NODE_ENV:-development}

npx webpack watch --mode=$NODE_ENV
