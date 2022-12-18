# Create image based on the official Node 6 image from the dockerhub
FROM node:16

# Create a directory where our app will be placed
RUN mkdir -p /usr/src/app

# Change directory so that our commands run inside this new directory
WORKDIR /usr/src/app

# Copy dependency definitions
COPY package*.json yarn.lock /usr/src/app/

# Install dependencies
RUN yarn --pure-lockfile

# Get all the code needed to run the app
COPY . /usr/src/app/

# Expose the port the app runs in
EXPOSE 2415

# Serve the app
CMD ["yarn", "start"]
