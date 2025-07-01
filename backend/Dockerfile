FROM node:20-slim

WORKDIR /usr/src/app

# Create directory structure
RUN mkdir -p services/messaging-ai-service common

# Copy common module files
COPY common/package*.json ./common/
WORKDIR /usr/src/app/common
RUN npm install --production

# Copy service files
WORKDIR /usr/src/app
COPY services/messaging-ai-service/package*.json ./services/messaging-ai-service/
WORKDIR /usr/src/app/services/messaging-ai-service
RUN npm install --production

# Copy source code
WORKDIR /usr/src/app
COPY common ./common/
COPY services/messaging-ai-service ./services/messaging-ai-service/

# Create symlinks for module aliases
RUN mkdir -p /usr/src/app/services/messaging-ai-service/node_modules/@common
RUN ln -s /usr/src/app/common /usr/src/app/services/messaging-ai-service/node_modules/@common

# Make sure @services directory exists before creating the symlink :')
RUN mkdir -p /usr/src/app/services/messaging-ai-service/node_modules/@services
RUN ln -s /usr/src/app/services/messaging-ai-service /usr/src/app/services/messaging-ai-service/node_modules/@services/messaging-ai-service

# Expose the port the app runs on
EXPOSE 8089

# Set working directory to the service
WORKDIR /usr/src/app/services/messaging-ai-service

# Start the application
CMD [ "npm", "start" ]