# Use Node.js base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Add curl for healthcheck
RUN apk add --no-cache curl

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all source files
COPY . .

# Expose port 3001 (the port your Express server uses)
EXPOSE 3001

# Create a health endpoint check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start the application
CMD ["npm", "start"]