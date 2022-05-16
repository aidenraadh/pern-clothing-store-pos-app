'use strict';

const {Op}               = require("sequelize")
const models             = require('../../models/index')
const InventoryTransfer  = models.InventoryTransfer
const StoreInventory     = models.StoreInventory
const StoreInventorySize = models.StoreInventorySize
const Store              = models.Store


module.exports = {
  up: async (queryInterface, Sequelize) => {
    const storeInv = await StoreInventory.findOne({
      attributes: ['inventory_id'],
      include: [
        {
          model: Store, as: 'store', attributes: ['id'],
          where: {owner_id: 1},
        },
        {
          model: StoreInventorySize, as: 'sizes',
          attributes: ['inventory_size_id']
        }
      ]
    })
    const destinationStore = await Store.findOne({
      attributes: ['id'],
      where: {
        id: {[Op.not]: storeInv.store.id}
      }
    })
    await InventoryTransfer.create({
      inventory_id: storeInv.inventory_id,
      inventory_size_id: storeInv.sizes[0].inventory_size_id,
      amount: 10,
      origin_store_id: storeInv.store.id,
      destination_store_id: destinationStore.id,
      transfer_date: new Date()
    })
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
