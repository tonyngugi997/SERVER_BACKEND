FROM node:18-alpine

WORKDIR /app

# Install SQLite
RUN apk add --no-cache sqlite

# Copy package files
COPY package.json package-lock.json ./

# Clear npm cache and install dependencies
RUN npm cache clean --force && \
    npm ci --omit=dev --ignore-scripts

# Copy app files
COPY . .

# Create data directory for SQLite
RUN mkdir -p /app/data

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "server.js"]
