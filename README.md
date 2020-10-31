# Penn Clubs

[![CircleCI](https://circleci.com/gh/pennlabs/penn-clubs.svg?style=shield)](https://circleci.com/gh/pennlabs/penn-clubs)
[![Coverage Status](https://codecov.io/gh/pennlabs/penn-clubs/branch/master/graph/badge.svg)](https://codecov.io/gh/pennlabs/penn-clubs)

Official React-based website for Penn Labs' club directory and events listings.
The REST API written in Django for Penn Clubs infrastructure.

## Installation
You will need to start both the backend and the frontend to do Penn Clubs development.

Questions? Check out our [extended guide](https://github.com/pennlabs/penn-clubs/wiki/Development-Guide#windows-development) for FAQs for both Mac and Windows.

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

To run the server, `cd` to the folder where you cloned `penn-clubs`. Then run:
- `cd backend`
- `$ pipenv install` to install Python dependencies. This may take a few minutes.
- `$ pipenv shell`
- `$ ./manage.py migrate`
- `$ ./manage.py runserver`

When installing locally for development, run:

- `cd backend`
- `pipenv install --dev` to install dependencies
- `./manage.py migrate` to create database
- `./manage.py populate` to add test data to database
- `./manage.py runserver` to run server

### Frontend

Running the frontend requires [Node.js](https://nodejs.org/en/) and [Yarn](https://yarnpkg.com/getting-started/install).

You will need to set the following environment variables on the frontend:
- `NEXT_PUBLIC_GOOGLE_API_KEY`
- `NEXT_PUBLIC_SITE_NAME` (Optional)
  - Specify `clubs` to show Penn Clubs and `fyh` to show Hub@Penn.

1. Enter the `frontend` directory with a **new terminal window**. Don't kill your backend server!
2. Install dependencies using `yarn install` in the project directory.
3. Run application using `yarn dev`.
4. Access application at [http://localhost:3000](http://localhost:3000).

### Development

Click `Login` to log in as a test user. The `./manage.py populate` command creates a test user for you with username `bfranklin` and password `test`. Go to `/api/admin` to login to this account.

To grant all users in the database superuser privileges for development:
```bash
cd backend
pipenv shell
./manage.py shell_plus
>>> User.objects.all().update(is_superuser=True, is_staff=True)
```
