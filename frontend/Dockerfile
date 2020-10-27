FROM node:14.14.0-buster-slim

LABEL maintainer="Penn Labs"

WORKDIR /app/

# Install cypress dependencies
RUN apt-get update && apt-get install -y libgtk2.0-0 libgtk-3-0 libgbm-dev libnotify-dev libgconf-2-4 libnss3 libxss1 libasound2 libxtst6 xauth xvfb && rm -rf /var/lib/apt/lists/*

# Copy project dependencies
COPY package.json /app/
COPY yarn.lock /app/

# Install project dependencies
RUN yarn install --frozen-lockfile --production=false

# Copy project files
COPY . /app/

# Disable telemetry back to zeit
ENV NEXT_TELEMETRY_DISABLED=1

# Set branding
ARG NEXT_PUBLIC_SITE_NAME=clubs

# Build project
RUN yarn build

CMD ["yarn", "start"]
