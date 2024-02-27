FROM node:20.11.1-buster-slim

LABEL maintainer="Penn Labs"

RUN apt-get update \
    && apt-get install --no-install-recommends -y curl unzip openssl ca-certificates \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install bun
RUN curl -fsSL https://bun.sh/install | bash && \
    ln -s ~/.bun/bin/bun /usr/local/bin/bun

WORKDIR /app/

# Copy project dependencies
COPY package.json /app/
COPY bun.lockb /app/

# Install project dependencies
RUN bun install --frozen-lockfile

# Copy project files
COPY . /app/

# Disable telemetry back to zeit
ENV NEXT_TELEMETRY_DISABLED=1

# Build project
RUN bun run build

CMD ["bun", "start"]
