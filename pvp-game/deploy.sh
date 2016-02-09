#!/bin/sh
gulp
git add -A
git commit -am "build"
git push heroku master