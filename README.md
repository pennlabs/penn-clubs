# Penn Clubs

[![Build and Deploy Clubs](https://github.com/pennlabs/penn-clubs/workflows/Build%20and%20Deploy%20Clubs/badge.svg?branch=master)](https://github.com/pennlabs/penn-clubs/actions)
[![Coverage Status](https://codecov.io/gh/pennlabs/penn-clubs/branch/master/graph/badge.svg)](https://codecov.io/gh/pennlabs/penn-clubs)

Official platform for club discovery, recruitment, and events at Penn.
React/Next.js frontend and Django-based REST API.

## Installation

You will need to start both the backend and the frontend to develop on Penn Clubs. Clubs supports Mac and Linux/WSL development.

Questions? Check out our [extended guide](https://github.com/pennlabs/penn-clubs/wiki/Development-Guide) for FAQs.

### Backend

Running the backend requires [uv](https://docs.astral.sh/uv/getting-started/installation/) running Python 3.13.

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

#### Ticketing/Payment Environment Variables

For ticketing functionality with CyberSource Secure Acceptance Hosted Checkout, you will need:

- `CYBERSOURCE_SA_PROFILE_ID` - Your Secure Acceptance profile ID from the CyberSource Business Center
- `CYBERSOURCE_SA_ACCESS_KEY` - Access key for the Secure Acceptance profile
- `CYBERSOURCE_SA_SECRET_KEY` - Secret key for signing requests (keep this secure!)
- `FRONTEND_URL` (optional) - Base URL for redirects after payment (defaults to `https://pennclubs.com`)

The merchant ID (`upenn8504`) and CyberSource endpoint URLs are configured in the settings files:
- **Production**: `https://secureacceptance.cybersource.com/pay`
- **Development/Test**: `https://testsecureacceptance.cybersource.com/pay`

To obtain these credentials:
1. Log into the [CyberSource Business Center](https://businesscenter.cybersource.com)
2. Navigate to Payment Configuration → Secure Acceptance Settings
3. Create or select a Hosted Checkout profile
4. Generate security keys and note the Profile ID, Access Key, and Secret Key

To run the server, `cd` to the folder where you cloned `penn-clubs`. Then run:

- `cd backend`

Setting up `psycopg2` on Mac (this is necessary if you want to be able to modify
dependencies, you can revisit later if not)

- `$ brew install postgresql`
- `$ brew install openssl`
- `$ brew unlink openssl && brew link openssl --force`
- `$ echo 'export PATH="/usr/local/opt/openssl@3/bin:$PATH"' >> ~/.zshrc`
- `$ export LDFLAGS="-L/usr/local/opt/openssl@3/lib"`
- `$ export CPPFLAGS="-I/usr/local/opt/openssl@3/include"`

Now, you can run

- `$ sudo add-apt-repository ppa:deadsnakes/ppa && sudo apt-get update && sudo apt-get install gcc python3.13-dev libpq-dev` for necessary Python package build dependencies (Linux only)
- `$ uv sync` to install Python dependencies. This may take a few
  minutes. If you skipped installing `psycopg2` earlier, you might see
  an error with locking -- this is expected!
- `$ uv run pre-commit install`
- `$ uv run ./manage.py migrate`
- `$ uv run ./manage.py populate` (in development,
  to populate the database with dummy data)
- `$ uv run ./manage.py runserver`

Use `$ uv run ./manage.py test` to run unit tests.

### Frontend

Running the frontend requires [Node.js](https://nodejs.org/en/) and
[Bun](https://bun.sh).

**Please ensure you are using Node 20**. Our codebase does not support other
versions of Node (v20.11.1 is stable).

You will need to set the following environment variables on the frontend in production:

- `NEXT_PUBLIC_GOOGLE_API_KEY`
- `NEXT_PUBLIC_SITE_NAME` (Optional)
  - Specify `clubs` to show Penn Clubs and `fyh` to show Hub@Penn.

1. Enter the `frontend` directory with a **new terminal window**. Don't kill your backend server!
2. Install dependencies using `bun install` in the project directory.
3. Run application using `bun dev`.
4. Access application at [http://localhost:3000](http://localhost:3000).

### Development

Click `Login` to log in as a test user. The `./manage.py populate` command creates a test user for you with username `bfranklin` and password `test`. Go to `/api/admin` to login to this account.

#### Ticketing

Penn Clubs uses CyberSource Secure Acceptance Hosted Checkout for payment processing. This redirects users to a CyberSource-hosted payment page rather than embedding a payment form.

**Payment Flow:**
1. User initiates checkout → Backend generates signed payment parameters
2. Frontend submits a form POST to CyberSource with the signed parameters
3. User enters payment details on CyberSource's hosted page
4. CyberSource POSTs results back to `/api/tickets/payment_complete/`
5. Backend validates the signature, processes the payment, and redirects user

**Local Development with ngrok:**

CyberSource needs to POST payment results back to your server, which requires a publicly accessible URL. Use [ngrok](https://ngrok.com/) to create a tunnel to your local development server.

1. **Install ngrok:**
   ```bash
   # Ubuntu/Debian
   curl -sSL https://ngrok-agent.s3.amazonaws.com/ngrok.asc \
     | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null \
     && echo "deb https://ngrok-agent.s3.amazonaws.com buster main" \
     | sudo tee /etc/apt/sources.list.d/ngrok.list \
     && sudo apt update && sudo apt install ngrok

   # Or via snap
   sudo snap install ngrok

   # Mac
   brew install ngrok
   ```

2. **Start ngrok** (in a separate terminal):
   ```bash
   ngrok http 3000
   ```
   Copy the HTTPS forwarding URL (e.g., `https://abc123.ngrok-free.app`)

3. **Create a `.env` file** in the `backend` directory with your CyberSource test credentials:
   ```bash
   CYBERSOURCE_SA_PROFILE_ID=your-test-profile-id
   CYBERSOURCE_SA_ACCESS_KEY=your-test-access-key
   CYBERSOURCE_SA_SECRET_KEY=your-test-secret-key
   NGROK_URL=https://abc123.ngrok-free.app
   ```

4. **Start the backend:**
   ```bash
   cd backend
   DJANGO_SETTINGS_MODULE=pennclubs.settings.development uv run ./manage.py runserver
   ```

5. **Start the frontend** (in another terminal):
   ```bash
   cd frontend
   bun dev
   ```

6. **Access the app** at `http://localhost:3000` (NOT the ngrok URL)

The `NGROK_URL` environment variable configures the CyberSource callback URL and adds the ngrok URL to `CSRF_TRUSTED_ORIGINS`. Keep the browser on `http://localhost:3000` for login and redirects; do not set `DOMAIN` when running the frontend for this flow.

Note: In development, the backend uses the CyberSource test endpoint (`testsecureacceptance.cybersource.com`). Use [CyberSource test card numbers](https://developer.cybersource.com/hello-world/testing-guide.html) for testing.
