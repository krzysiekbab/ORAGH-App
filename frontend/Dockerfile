# Multi-stage Production Dockerfile for React Frontend
FROM node:18-alpine as build

# Set work directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
RUN rm -f package-lock.json && npm install

# Copy source code
COPY . .

# Build the app for production
RUN npm run build

# Production stage - Nginx serves static files
FROM nginx:1.25-alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy built React app to nginx html directory
COPY --from=build /app/dist /usr/share/nginx/html

# Nginx will use configuration mounted from docker-compose.yml
# This allows for easy updates without rebuilding the image

# Create nginx user and set permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Expose ports
EXPOSE 80 443

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

# Run nginx
CMD ["nginx", "-g", "daemon off;"]
