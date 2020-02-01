#!/bin/bash

export PIPENV_VENV_IN_PROJECT=1
export LC_ALL=C.UTF-8
export LANG=C.UTF-8

# Setup Python backend server
pushd ../backend
pipenv install --dev
pipenv run ./manage.py migrate
pipenv run ./manage.py runserver & npx wait-on -s 3 -d 500 -t 30000 http://localhost:8000/api || exit 1
popd

# Setup frontend server
node server.js & npx wait-on -s 3 -d 500 -t 30000 http://localhost:3000

# Run tests
npx cypress run
RET=$?

# Kill background servers
kill $(jobs -p)
exit $RET
