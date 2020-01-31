# Penn Clubs

[![CircleCI](https://circleci.com/gh/pennlabs/penn-clubs.svg?style=shield)](https://circleci.com/gh/pennlabs/penn-clubs)
[![Coverage Status](https://codecov.io/gh/pennlabs/penn-clubs/branch/master/graph/badge.svg)](https://codecov.io/gh/pennlabs/penn-clubs)

Official React-based website for Penn Labs' club directory and events listings.
The REST API written in Django for Penn Clubs infrastructure.

## Installation
You will need to start both the backend and the frontend to do Penn Clubs development.

### Backend

Running the backend requires [Python 3](https://www.python.org/downloads/).

In production, you will need to set the following environment variables:
- `SECRET_KEY`
- `SENTRY_URL`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_STORAGE_BUCKET_NAME`
- `LABS_REDIRECT_URI`
- `LABS_CLIENT_ID` (from Platform)
- `LABS_CLIENT_SECRET` (from Platform)



To run the server, ```cd``` to the folder where you clone ```penn-clubs```. Then run:
- `$ pipenv install`. You should be seeing something like 
```bash Creating a virtualenv for this project…
Pipfile: /Users/PycharmProjects/penn-clubs/backend/Pipfile
Using /Library/Frameworks/Python.framework/Versions/3.7/bin/python3 (3.7.2) to create virtualenv…
...
```
- `$ pipenv shell`. 
- `$ ./manage.py migrate`
- `$ ./manage.py runserver` 

When installing locally for development, run:

- `cd backend`
- `pipenv install --dev`. You should be seeing something like 
```bash
Installing dependencies from Pipfile.lock (78dd23)…
```
- `./manage.py migrate` 
- `./manage.py goap_import` to run scraper and import data into database. 
You should be seeing something like
```bash
Processing Page 1
Created '180 Degrees Consulting' (image: False)
Created '2020 Class Board' (image: False)
Updated '2021 Class Board' (image: False)
Updated '2022 Class Board' (image: False)
Updated '2023 Class Board' (image: False)
Created 'A Moment of Magic Penn' (image: False)
Created 'Academic Demolition Team' (image: False)
Created 'Access Engineering' (image: False)
Created 'Active Minds' (image: True)
```
- ` ./manage.py runserver` to run server

Access application Access application at [http://localhost:3000](http://localhost:3000). Click `Login` to log in as a testuser.To grant all users in the database superuser privileges for development:
```bash
cd backend
pipenv shell
./manage.py shell_plus
>>> User.objects.all().update(is_superuser=True, is_staff=True)
```

### Frontend

Running the frontend requires [Node.js](https://nodejs.org/en/).

1. Enter the `frontend` directory.
2. Install dependencies using `npm install --dev` in the project directory.
3. Run application using `npm run dev`.
4. Access application at [http://localhost:3000](http://localhost:3000).
