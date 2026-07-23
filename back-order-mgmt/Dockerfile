FROM node:22-slim

WORKDIR /app

COPY ZscalerRootCA.cer ./ZscalerRootCA.crt

ARG NODE_EXTRA_CA_CERTS="/app/ZscalerRootCA.crt"

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY . .

CMD ["npm", "run", "dev"]