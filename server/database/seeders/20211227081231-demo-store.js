'use strict';

const Store = require('../../models/index').Store

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const stores = [
      {
        name: 'Store 1', owner_id: 1, type_id: 1
      },
      {
        name: 'Store 2', owner_id: 1, type_id: 1
      },      
    ]
    await Store.bulkCreate(stores)
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  }
};
