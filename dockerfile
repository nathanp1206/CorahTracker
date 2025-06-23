# Use Node.js base image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy app source code
COPY . .

# Explicitly copy BigQuery credentials, config, and admin script
COPY bigQuery/ bigQuery/
COPY bigquery-config.js .
COPY admin-delete-player.js .

# Expose Express port
EXPOSE 80

# Start your server
CMD ["node", "server.js"]
