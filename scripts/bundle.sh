#!/bin/bash

set -ex

NODE_ENV=${NODE_ENV:-development}

npx webpack build --mode=$NODE_ENV
