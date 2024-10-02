# Use Node.js version 18.15.0 as a parent image
FROM node:18.15.0

# Set the working directory in the container
WORKDIR /usr/src/app

# Install Chromium and its dependencies
RUN apt-get update && apt-get install -y \
    chromium \
    chromium-driver \
    && rm -rf /var/lib/apt/lists/*

# Set the PUPPETEER_EXECUTABLE_PATH environment variable
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Copy package.json and pnpm-lock.yaml into the working directory
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN npm install -g pnpm

# Install project dependencies
RUN pnpm install

# Copy the rest of your application's code into the container
COPY . .

# Build the application
RUN pnpm run build

# Command to run the application
CMD ["pnpm", "dev"]
