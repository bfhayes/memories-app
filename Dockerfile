FROM node:22-slim

WORKDIR /app

# Install root dependencies (wrangler, drizzle-orm, jose)
COPY package.json package-lock.json ./
RUN npm ci

# Install frontend dependencies
COPY frontend/package.json frontend/package-lock.json ./frontend/
RUN cd frontend && npm ci

# Copy source (volumes override this in dev)
COPY . .

USER node
