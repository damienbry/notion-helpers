#!/bin/sh

cp ../sample/.pre-commit-config.yaml .
cp ../sample/.eslintrc.js .
cp ../sample/.eslintignore .
cp ../sample/prettierignore .

yarn add -D prettier eslint-plugin-prettier eslint-config-prettier eslint @babel/core @babel/eslint-parser

pre-commit install

