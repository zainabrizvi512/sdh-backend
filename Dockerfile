# 1) Build
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY sdh-service-account-key.json /app/secrets/gcp.json
ENV GOOGLE_APPLICATION_CREDENTIALS=/app/secrets/gcp.json
RUN npm ci
COPY . .
RUN npm run build

# 2) Run
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/main.js"]
