FROM node:10.18.0-buster-slim

LABEL maintainer="Penn Labs"

WORKDIR /app/

# Copy project dependencies
COPY package*.json /app/

# Install project dependencies
RUN npm install --production

# Copy project files
COPY . /app/

# Build project
RUN npm run build

CMD ["npm", "start"]
