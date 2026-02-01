FROM node:18-alpine

WORKDIR /app

# Install SQLite
RUN apk add --no-cache sqlite

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy app files
COPY . .

# Create data directory
RUN mkdir -p /app/data

# Expose port 3000 (Railway's default)
EXPOSE 3000

# Start server
CMD ["node", "server.js"]
