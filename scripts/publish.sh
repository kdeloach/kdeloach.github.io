#!/bin/bash

set -ex

git config user.name github-actions
git config user.email github-actions@github.com
git checkout --orphan gh-pages
git rm -rf .
rm -rf assets/
git add public/
shopt -s dotglob  # to move .nojekyll
git mv public/* .
git commit -m 'Build site from CI'
git push -f origin HEAD
