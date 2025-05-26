# Use Node.js base image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy everything else
COPY . .

# Expose Express port
EXPOSE 80

# Start your server
CMD ["node", "server.js"]
