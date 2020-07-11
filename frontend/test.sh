#!/bin/bash

set -e

export PIPENV_VENV_IN_PROJECT=1
export LC_ALL=C.UTF-8
export LANG=C.UTF-8

# Kill background servers
trap 'kill $(jobs -p)' EXIT

# ake test-results folder
mkdir -p test-results
if ! [ "$(expr substr $(uname -s) 1 4)" == "MING" ]; then
  mkdir -p ./cypress/screenshots
  mkdir -p ./cypress/videos
  ln -s ./cypress/screenshots ./test-results/screenshots
  ln -s ./cypress/videos ./test-results/videos
fi

# Setup Python backend server
pushd ../backend
time pipenv install --dev || echo "Failed to install all dependencies, continuing anyways..."
pipenv run python manage.py migrate
pipenv run python manage.py populate
pipenv run python manage.py runserver 2>&1 > ../frontend/test-results/django-server.log &
popd
yarn run wait-on -s 3 -d 500 -t 30000 http://localhost:8000/api

# Setup frontend server
node server.js 2>&1 > ./test-results/node-server.log &
yarn run wait-on -s 3 -d 500 -t 30000 http://localhost:3000

# Run tests
yarn run cypress run
