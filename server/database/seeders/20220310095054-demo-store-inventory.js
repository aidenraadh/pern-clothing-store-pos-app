'use strict';

const models             = require('../../models/index')
const StoreInventory     = models.StoreInventory
const StoreInventorySize = models.StoreInventorySize

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Seed the store_inventories
    const storeInventory = await StoreInventory.create({
      store_id: 1, inventory_id: 1, total_amount: 20,
    })    

    // Seed the store_inventory_sizes
    const sizes = await StoreInventorySize.bulkCreate([
      {store_inventory_id: storeInventory.id, inventory_size_id: 1, amount: 10},
      {store_inventory_id: storeInventory.id, inventory_size_id: 2, amount: 10},
    ])    
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
