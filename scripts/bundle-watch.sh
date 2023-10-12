#!/bin/bash

set -ex

NODE_ENV=${NODE_ENV:-development}

dir=$1

cd $dir && npx webpack watch --mode=$NODE_ENV
