# Penn Clubs

[![CircleCI](https://circleci.com/gh/pennlabs/clubs.svg?style=svg)](https://circleci.com/gh/pennlabs/clubs)

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

To run the server, run:
```bash
cd backend
pipenv install
pipenv shell
./manage.py migrate
./manage.py runserver
```

When installing locally for development, run:
```bash
cd backend
pipenv install --dev
pipenv shell
./manage.py migrate
./manage.py goap_import
./manage.py runserver
```

To grant all users in the database superuser privileges for development:
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
3. Set the `API_BASE_URL` environment variable to your local backend server (most likely `http://localhost:8000/`).
4. Run application using `npm run dev`.
5. Access application at [http://localhost:3000](http://localhost:3000).
