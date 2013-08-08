#!/bin/bash  

git checkout develop
git branch
git add .
git commit -a -m 'development changes'
git pull origin develop
git push origin develop
