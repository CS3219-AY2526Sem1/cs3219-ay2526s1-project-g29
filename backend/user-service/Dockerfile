# Use Node.js base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Add curl for healthcheck
RUN apk add --no-cache curl

# Default port env (overrideable from docker-compose/.env)
ENV USER_PORT=3001

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all source files
COPY . .

EXPOSE ${USER_PORT}

# Create a health endpoint check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${USER_PORT:-3001}/health || exit 1

# Start the application
CMD ["npm", "start"]