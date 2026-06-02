FROM node:24.16-alpine
WORKDIR /app

COPY package*.json ./
RUN npm install -g @angular/cli@21.2.11

RUN npm install

COPY . .

EXPOSE 4200

CMD ["npm", "run", "start", "--", "--host", "0.0.0.0", "--poll", "2000"]