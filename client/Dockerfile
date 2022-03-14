FROM node:14-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY . .

CMD ["npm","start"]

# Run with docker run --name client_container --env-file ./.env  -p 3000:3000 -v C:\xampp\htdocs\clothing-store-pos\client\src:/app/src client_image