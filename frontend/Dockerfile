# Use Node.js base image for serving static files
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy all frontend files
COPY . .

# Build static assets (including collaboration bundle)
RUN npm run build:collab

# Expose port 3000
EXPOSE 3000

# Add curl for healthcheck
RUN apk add --no-cache curl

# Start the http-server
CMD ["npm", "start"]
