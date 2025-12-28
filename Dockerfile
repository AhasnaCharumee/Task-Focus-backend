# Use official Node.js LTS image
FROM node:22-alpine

# Create app directory
WORKDIR /app


# Install all dependencies (including dev)
COPY package*.json ./
RUN npm install

# Copy app source
COPY . .


# Build (if using TypeScript)
RUN npm run build

# Remove dev dependencies to make image smaller (optional)
RUN npm prune --production

# Expose port
EXPOSE 3000

# Start app
CMD ["node", "dist/index.js"]
