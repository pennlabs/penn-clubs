FROM node:10.18.0-buster-slim

LABEL maintainer="Penn Labs"

WORKDIR /app/

# Copy project dependencies
COPY package.json /app/
COPY yarn.lock /app/

# Install project dependencies
RUN yarn install --frozen-lockfile --production

# Copy project files
COPY . /app/

# Build project
RUN yarn build

CMD ["yarn", "start"]
