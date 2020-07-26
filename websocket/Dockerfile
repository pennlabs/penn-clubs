FROM node:10.18.0-buster-slim

LABEL maintainer="Penn Labs"

WORKDIR /app/

COPY package.json /app/
COPY yarn.lock /app/

RUN yarn install --frozen-lockfile --production=false

COPY . /app/

CMD ["yarn", "start"]
