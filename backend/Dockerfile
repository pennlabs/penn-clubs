FROM pennlabs/django-base:9c4f31bf1af44219d0f9019271a0033a222291c2-3.8.5

LABEL maintainer="Penn Labs"

# Copy project dependencies
COPY Pipfile* /app/

# Install project dependencies
RUN pipenv install --system

# Copy project files
COPY . /app/

ENV DJANGO_SETTINGS_MODULE pennclubs.settings.production
ENV SECRET_KEY 'temporary key just to build the docker image'

# Copy custom asgi-run
COPY ./scripts/asgi-run /usr/local/bin/

# Collect static files
RUN python3 /app/manage.py collectstatic --noinput
