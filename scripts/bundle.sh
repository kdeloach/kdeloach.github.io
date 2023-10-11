#!/bin/bash

set -ex

NODE_ENV=${NODE_ENV:-development}

dir=$1

cd $dir && npx webpack build --mode=$NODE_ENV
