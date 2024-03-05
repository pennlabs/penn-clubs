# Penn Clubs

[![Build and Deploy](https://github.com/pennlabs/penn-clubs/workflows/Build%20and%20Deploy/badge.svg)](https://github.com/pennlabs/penn-clubs/actions)
[![Coverage Status](https://codecov.io/gh/pennlabs/penn-clubs/branch/master/graph/badge.svg)](https://codecov.io/gh/pennlabs/penn-clubs)

Official React-based website for Penn Labs' club directory and events listings.
The REST API written in Django for Penn Clubs infrastructure.

## Installation

You will need to start both the backend and the frontend to do Penn Clubs development.

Questions? Check out our [extended guide](https://github.com/pennlabs/penn-clubs/wiki/Development-Guide#windows-development) for FAQs for both Mac and Windows.

### Backend

Running the backend requires [Python 3](https://www.python.org/downloads/).

In production, you will need to set the following environment variables:

- `NEXT_PUBLIC_SITE_NAME` (optional, defaults to `clubs`)
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

Setting up `psycopg2` (this is necessary if you want to be able to modify
dependencies, you can revisit later if not)

- Mac
  - `$ brew install postgresql`
  - `$ brew install openssl`
  - `$ brew unlink openssl && brew link openssl --force`
  - `$ echo 'export PATH="/usr/local/opt/openssl@3/bin:$PATH"' >> ~/.zshrc`
  - `$ export LDFLAGS="-L/usr/local/opt/openssl@3/lib"`
  - `$ export CPPFLAGS="-I/usr/local/opt/openssl@3/include"`
- Windows
  - `$ apt-get install gcc python3-dev libpq-dev`

Now, you can run

- `$ pipenv install` to install Python dependencies. This may take a few
  minutes. Optionally include the `--dev` argument if you are installing locally
  for development. If you skipped installing `psycopg2` earlier, you might see
  an error with locking -- this is expected!
- `$ pipenv shell`
- `$ pre-commit install`
- `$ ./manage.py migrate` OR `$ python3 manage.py migrate`
- `$ ./manage.py populate` OR `$ python3 manage.py populate` (in development,
  to populate the database with dummy data)
- `$ ./manage.py runserver` OR `$ python3 manage.py runserver`

### Frontend

Running the frontend requires [Node.js](https://nodejs.org/en/) and
[Yarn](https://yarnpkg.com/getting-started/install).

**Please ensure you are using Node 20**. Our codebase does not support other
versions of Node (v20.11.1 is stable).

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
