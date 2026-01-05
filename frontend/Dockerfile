# Use official Node image
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json ./
COPY vite.config.ts ./
COPY tsconfig.json ./
COPY . .

RUN npm install --legacy-peer-deps
RUN npm run build

# Use nginx to serve the built files
FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
