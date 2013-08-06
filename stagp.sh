#!/bin/bash
git checkout staging
git branch
git merge develop
git pull origin staging
git push origin staging