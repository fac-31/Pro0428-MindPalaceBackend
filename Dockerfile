# Use Node LTS image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first (better Docker caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the code
COPY . .

# Expose the port (use your backend port)
EXPOSE 5000

# Default command to run the server
CMD ["npm", "start"]
