# Penn Clubs
[![CircleCI](https://circleci.com/gh/pennlabs/clubs-backend.svg?style=shield)](https://circleci.com/gh/pennlabs/clubs-backend)
[![Coverage Status](https://coveralls.io/repos/github/pennlabs/clubs-backend/badge.svg?branch=master)](https://coveralls.io/github/pennlabs/clubs-backend?branch=master)

The REST API written in Django for Penn Clubs infrastructure.

## Installation

Running the backend requires Python 3.

In production, you will need to set the following environment variables:
- `SECRET_KEY`
- `SENTRY_URL`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_STORAGE_BUCKET_NAME`
- `LABS_REDIRECT_URI`
- `LABS_CLIENT_ID` (from Platform)
- `LABS_CLIENT_SECRET` (from Platform)

```bash
pipenv install
pipenv shell
./manage.py migrate
./manage.py runserver
```

When installing locally for development, run
```bash
pipenv install --dev
pipenv shell
./manage.py migrate
./manage.py goap_import
./manage.py runserver
```
