#!/bin/bash

set -e

export PIPENV_VENV_IN_PROJECT=1
export LC_ALL=C.UTF-8
export LANG=C.UTF-8

# Kill background servers
trap 'kill $(jobs -p)' EXIT

# Add artifacts folder
mkdir -p ./test-results

# Setup Python backend server
pushd ../backend
time pipenv install --dev || echo "Failed to install all dependencies, continuing anyways..."
pipenv run python manage.py migrate
pipenv run python manage.py populate
pipenv run python manage.py runserver &
popd
yarn run wait-on -s 3 -d 500 -t 30000 http://localhost:8000/api

# Setup frontend server
node server.js &
yarn run wait-on -s 3 -d 500 -t 30000 http://localhost:3000

# Run tests
yarn run cypress run || (mv cypress/screenshots/* cypress/videos/* ./test-results/; exit 1)
