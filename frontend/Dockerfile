FROM node:10-buster

MAINTAINER Penn Labs

WORKDIR /app/

# Copy project dependencies
COPY package*.json /app/
COPY yarn.lock /app/

# Install project dependencies
RUN yarn install --production=true

# Copy project files
COPY . /app/

# Build
RUN yarn run build

CMD ["yarn", "start"]
