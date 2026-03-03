FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev
COPY . .

RUN npm run db:init

EXPOSE 4000
CMD ["npm", "start"]
