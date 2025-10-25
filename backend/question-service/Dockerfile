FROM node:18-alpine

WORKDIR /app

# Add curl for healthcheck
RUN apk add --no-cache curl

# Copy package files and install deps
COPY package*.json ./
RUN npm install --only=production

# Copy source
COPY . .

# Expose the service port (defaults to 8003 if PORT/QUESTION_PORT not set at runtime)
EXPOSE 8003

# Start the Node service
CMD ["npm", "start"]