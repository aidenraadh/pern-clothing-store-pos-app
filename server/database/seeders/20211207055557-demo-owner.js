'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const currentTime = new Date()
    const owners = [
      {
        created_at: currentTime,
        updated_at: currentTime          
      },      
    ]
    await queryInterface.bulkInsert('owners', owners);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('owners', null, {});
  }
};
