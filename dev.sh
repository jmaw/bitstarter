#!/bin/bash
git checkout develop
git branch
git add .
git commit -a -m $1
git push origin develop