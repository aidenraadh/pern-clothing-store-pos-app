'use strict';

const Store = require('../../models/index').Store

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await Store.create({name: 'Store 1', owner_id: 1})
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
