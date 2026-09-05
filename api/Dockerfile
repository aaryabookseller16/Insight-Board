FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src

# EXPOSE 8080 matches docker-compose.yml's explicit PORT=8080 override, not
# the app's own default of 3001 (see api/src/index.js) — this image only
# listens on 8080 when PORT is set accordingly at runtime.
EXPOSE 8080

CMD ["node", "src/index.js"]
