# ---- build ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# If TS: build; if JS: this will no-op if no script
RUN npm run build || true

# ---- runtime ----
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
# If your server starts from dist/index.js; adjust if different
EXPOSE 4000
CMD ["node", "dist/index.js"]
