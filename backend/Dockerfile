FROM pennlabs/django-base

# Copy project dependencies
COPY Pipfile* /app/

RUN apt-get update && apt-get install --no-install-recommends -y libjpeg-dev \
    && rm -rf /var/lib/apt/lists/*

# Install project dependencies
RUN pipenv install --system

# Copy project files
COPY . /app/

ENV DJANGO_SETTINGS_MODULE pennclubs.settings.production
ENV SECRET_KEY 'fake dev security key that is longer than 50 characters.'

# Collect static files
RUN python3 /app/manage.py collectstatic --noinput