FROM pennlabs/django-base:898eea6a8f745786e5110ca6d0e059ce950d9636

LABEL maintainer="Penn Labs"

# Copy project dependencies
COPY Pipfile* /app/

# Install project dependencies
RUN pipenv install --system

# Copy project files
COPY . /app/

ENV DJANGO_SETTINGS_MODULE pennclubs.settings.production
ENV SECRET_KEY 'temporary key just to build the docker image'

# Collect static files
RUN python3 /app/manage.py collectstatic --noinput
