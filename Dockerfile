# Use official Node.js runtime as parent image
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first to leverage cache
COPY package*.json ./

# Install dependencies
RUN npm install 

# Copy the rest of the application code
COPY . .

# Expose the API port
EXPOSE 3001

# Start the application
CMD ["npm", "start"]