# Use Node.js version 18.15.0 as a parent image
FROM node:18.15.0
# Set the working directory in the container
WORKDIR /usr/src/app
# Copy package.json and pnpm-lock.yaml into the working directory
COPY package.json pnpm-lock.yaml ./
# Install dependencies
RUN npm install -g pnpm
# Conditionally install Chromium if on arm64 architecture and set PUPPETEER_EXECUTABLE_PATH environment variable
RUN if [ "$(uname -m)" = "aarch64" ]; then \
      apt-get update && apt-get install -y chromium && \
      export PUPPETEER_SKIP_DOWNLOAD=true && \
      export PUPPETEER_EXECUTABLE_PATH=`which chromium`; \
    fi
# Install project dependencies
RUN pnpm install
# Copy the rest of your application's code into the container
COPY . .
# Build the application
RUN pnpm run generate && pnpm run migrate --force
# Command to run the application
CMD ["pnpm", "start"]