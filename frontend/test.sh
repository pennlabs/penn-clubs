#!/bin/bash

set -e

export PIPENV_VENV_IN_PROJECT=1
export LC_ALL=C.UTF-8
export LANG=C.UTF-8

# Kill background servers
trap 'kill $(jobs -p)' EXIT

# Setup Python backend server
pushd ../backend
time pipenv install --dev
pipenv run ./manage.py migrate
pipenv run ./manage.py populate
pipenv run ./manage.py runserver & npx wait-on -s 3 -d 500 -t 30000 http://localhost:8000/api
popd

# Setup frontend server
node server.js & yarn run wait-on -s 3 -d 500 -t 30000 http://localhost:3000

# Run tests
yarn run cypress run
