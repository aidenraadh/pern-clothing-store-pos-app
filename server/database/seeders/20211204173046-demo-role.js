'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const currentTime = new Date()
    const roles = [
      {
        name: 'Super admin',
        created_at: currentTime,
        updated_at: currentTime          
      },
      {
        name: 'Owner',
        created_at: currentTime,
        updated_at: currentTime          
      },      
    ]
    await queryInterface.bulkInsert('Roles', roles);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Roles', null, {});
  }
};
