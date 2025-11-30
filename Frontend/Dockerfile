# Stage 1: build React app
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

ENV NODE_ENV=production
RUN npm run build

# Stage 2: serve bằng nginx
FROM nginx:alpine AS production

# Copy file cấu hình nginx (đã listen 8080)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build React sang nginx
COPY --from=builder /app/build /usr/share/nginx/html

# Phân quyền thư mục static
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Cloud Run sẽ inject PORT=8080, nginx đang listen 8080 trong nginx.conf
EXPOSE 8080


CMD ["nginx", "-g", "daemon off;"]
