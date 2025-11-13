FROM node:18-alpine

WORKDIR /app

# Add curl for healthcheck
RUN apk add --no-cache curl

# Default port env (overrideable from docker-compose/.env)
ENV MATCHING_PORT=8082

# Copy package files and install
COPY package*.json ./
RUN npm install --production

# Copy source
COPY . .

EXPOSE ${MATCHING_PORT}

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD /bin/sh -c 'curl -f http://localhost:${MATCHING_PORT:-8080}/health || exit 1'

CMD ["npm", "start"]