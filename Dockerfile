# ---- Build Stage ----
FROM node:18-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --production=false
COPY . .

# ---- Production Stage ----
FROM node:18-slim
WORKDIR /app
COPY --from=build /app /app
RUN npx playwright install --with-deps
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "src/server.js"] 