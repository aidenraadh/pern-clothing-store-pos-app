## Description

This is a simple PERN point of sale app for managing multiple clothing stores.

## Main Stacks

PostgreSQL\
Express\
React JS\
Node JS

## System Requirements

PostgreSQL v.14.2 or higher.\
Node JS v14.15.4 or higher.

## How to run this app

### Docker Initialization

1. Create `.env` file inside client folder based on the `.env.example` file.
2. Create ENV files inside server folder based on the `.env.example` file. For development the name should be `development.env`, for production the name should be `production.env` and so on.
3. Create `.env` file inside client folder based on the `.env.example` file.
5. For development mode, `docker-compose -f docker-compose.dev.yml up -d` from root folder.
4. From your server's container run `node utils/generateKeyPair.js` to generate private and public key for JWT authentication.
6. From your server's container run `npx sequelize-cli db:migrate` to migrate your database.
7. From your server's container run `npx sequelize-cli db:seed:all` to seed your database (optional).

### Server Initialization

1. Create your PostgreSQL database.
2. Go to the `server` folder.
3. Create the your `.env` file based on `.env.example`. For development the name should be `development.env`, for production the name should be `production.env` and so on.
4. Run `npm install`.
7. Create your private and public key for JWT by running `node utils/generateKeyPair`.
5. Run the migration files with `npx sequelize-cli db:migrate`.
6. Run the seeder files with `npx sequelize-cli db:seed:all` (optional).
8. Run the server in your local with `npm run dev`.

### Client Initialization

1. Go to the `client` folder.
2. Create the your `.env` file based on `.env.example`.
3. Run `npm install`.
4. Run the client in your local with `npm start`.

## Author
Github: https://github.com/aidenraadh \
Email: aidenraadhdev@gmail.com\
Website: aidenraadh.com