FROM oven/bun:1.2.6-slim

LABEL maintainer="Penn Labs"

WORKDIR /app/

# Copy project dependencies
COPY package.json /app/
COPY bun.lock /app/

# Install project dependencies
RUN bun install --frozen-lockfile

# Copy project files
COPY . /app/

# Disable telemetry back to zeit
ENV NEXT_TELEMETRY_DISABLED=1

# Build project
RUN bun run build

CMD ["bun", "run", "start"]
