'use strict';

const bcrypt = require('bcrypt')

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const currentTime = new Date()
    const users = [
      {
        name: 'Test owner', email: 'testowner@gmail.com',
        password: await bcrypt.hash('12345678', 10),
        role_id: 2, owner_id: 1,
        created_at: currentTime,
        updated_at: currentTime          
      },    
    ]
    await queryInterface.bulkInsert('Users', users);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Users', null, {});
  }
};
