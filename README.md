## Description

This is a simple MERN app with JWT authentication. Feel free to download it as an underlay to
your Node.js app

## Main Stacks

MySQL\
Express\
React JS\
Node JS

## System Requirements

MySQL v.15.1 or higher.\
Node JS v14.15.4 or higher.

## How to run this app

### Server Initialization

1. Create your MySQL database.
2. Go to the `server` folder.
3. Create the your `.env` file based on `.env.example`.
4. Run `npm install`.
5. Run the migration files with `npx sequelize-cli db:migrate`.
6. Run the seeder files with `npx sequelize-cli db:seed:all` (optional).
7. Create your private and public key for JWT by running `node utils/generateKeyPair`.
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