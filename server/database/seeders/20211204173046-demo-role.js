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
        name: 'Admin',
        created_at: currentTime,
        updated_at: currentTime          
      },     
      {
        name: 'Employee',
        created_at: currentTime,
        updated_at: currentTime          
      },        
    ]
    await queryInterface.bulkInsert('roles', roles);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('roles', null, {});
  }
};
