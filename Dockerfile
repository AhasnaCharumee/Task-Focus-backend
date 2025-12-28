# Use official Node.js LTS image
FROM node:22-alpine

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm install --production

# Copy app source
COPY . .

# Build (if using TypeScript)
RUN npm run build

# Expose port
EXPOSE 3000

# Start app
CMD ["node", "dist/index.js"]
