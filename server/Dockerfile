FROM node:14-alpine

WORKDIR /app

COPY package.json package-lock.json .

RUN npm install

COPY . .

CMD ["node","index"]

# Run with docker run --name server_container --env-file ./.env -p 7000:7000 -v C:\xampp\htdocs\clothing-store-pos\server:/app/code server_image nodemon -L index