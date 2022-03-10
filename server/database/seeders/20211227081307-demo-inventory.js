'use strict';

const models         = require('../../models/index')
const Inventory      = models.Inventory
const InventorySize  = models.InventorySize
const StoreInventory = models.StoreInventory

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Seed the inventory
    const inventory = await Inventory.create({
      name: 'Inventory 1', owner_id: 1
    })
    // Seed the inventory_sizes
    const sizes = await InventorySize.bulkCreate([
      {name: 'S', production_price: 50000, selling_price: 60000, inventory_id: inventory.id},
      {name: 'L', production_price: 60000, selling_price: 70000, inventory_id: inventory.id},
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
