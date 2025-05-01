# Use an official Node.js 20 image
FROM node:20.11.0

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app
COPY . .

# Expose the app port (optional but good practice)
EXPOSE 3000

# Run the app in development mode
CMD ["npm", "run", "start:dev"]
