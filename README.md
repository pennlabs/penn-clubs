# Penn Clubs

[![Build and Deploy](https://github.com/pennlabs/penn-clubs/workflows/Build%20and%20Deploy/badge.svg)](https://github.com/pennlabs/penn-clubs/actions)
[![Coverage Status](https://codecov.io/gh/pennlabs/penn-clubs/branch/master/graph/badge.svg)](https://codecov.io/gh/pennlabs/penn-clubs)

Official platform for club discovery, recruitment, and events at Penn.
React/Next.js frontend and Django-based REST API.

## Installation

You will need to start both the backend and the frontend to do Penn Clubs development.

You will need to start both the backend and the frontend to develop on Penn Clubs. Clubs supports Mac and Linux/WSL development.

Questions? Check out our [extended guide](https://github.com/pennlabs/penn-clubs/wiki/Development-Guide) for FAQs.

### Backend

Running the backend requires [Python 3.11](https://www.python.org/downloads/) and [Pipenv](https://pipenv.pypa.io/en/latest/).

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
- Linux/WSL
  - `$ apt-get install gcc python3-dev libpq-dev`

Now, you can run

- `$ pipenv install` to install Python dependencies. This may take a few
  minutes. Include the `--dev` argument if you are installing locally
  for development. If you skipped installing `psycopg2` earlier, you might see
  an error with locking -- this is expected!
- `$ pipenv shell`
- `$ pre-commit install`
- `$ ./manage.py migrate` OR `$ python3 manage.py migrate`
- `$ ./manage.py populate` OR `$ python3 manage.py populate` (in development,
  to populate the database with dummy data)
- `$ ./manage.py runserver` OR `$ python3 manage.py runserver`

Use `$ ./manage.py test` to run unit tests.

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

Use `$ yarn test` to run Cypress tests.

### Development

Click `Login` to log in as a test user. The `./manage.py populate` command creates a test user for you with username `bfranklin` and password `test`. Go to `/api/admin` to login to this account.

#### Ticketing

To test ticketing locally, you will need to [install](https://github.com/FiloSottile/mkcert?tab=readme-ov-file#installation) `mkcert`, enter the `frontend` directory, and run the following commands:

- `$ mkcert -install`
- `$ mkcert localhost 127.0.0.1 ::1`
- `$ export DOMAIN=https://localhost:3001 NODE_TLS_REJECT_UNAUTHORIZED=0`

Then, after the frontend is running, run `yarn ssl-proxy` **in a new terminal window** and access the application at [https://localhost:3001](https://localhost:3001).