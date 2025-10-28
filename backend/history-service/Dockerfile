FROM node:18-alpine

WORKDIR /app

# Add curl for healthcheck
RUN apk add --no-cache curl

# Copy package files and install deps
COPY package*.json ./
RUN npm install --only=production

# Copy source
COPY . .

# Expose the service port (defaults to 8005 if PORT/HISTORY_PORT not set at runtime)
EXPOSE 8005

# Start the Node service
CMD ["npm", "start"]