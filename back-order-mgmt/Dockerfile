FROM node:22-slim

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

CMD ["npx", "tsc", "watch", "src/index.ts"]