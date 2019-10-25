FROM pennlabs/django-base

# Copy project dependencies
COPY Pipfile* /app/

# Install project dependencies
RUN pipenv install --system

# Copy project files
COPY . /app/

# Collect static files
RUN python3.7 /app/manage.py collectstatic --noinput