'use strict';
const {Op}          = require("sequelize")
const models        = require('../../models/index')
const StoreTransaction          = models.StoreTransaction
const StoreTransactionInventory          = models.StoreTransactionInventory
const Inventory          = models.Inventory
const InventorySize          = models.InventorySize
const Store         = models.Store


module.exports = {
  up: async (queryInterface, Sequelize) => {
    const ownerId = 1

    // Get the store
    const store = await Store.findOne({
      where: {owner_id: ownerId},
      attributes: ['id'],
    })    

    // Get the inventory
    const inventory = await Inventory.findOne({
      where: {owner_id: ownerId},
      attributes: ['id'],
      include: [
        {
          model: InventorySize, as: 'sizes', 
          attributes: ['id', 'selling_price']        
        }
      ]
    })
    const transactionDate = new Date()
    const amountEachItem = 10
    let totalAmount = 0
    let totalCost = 0

    inventory.sizes.forEach((size) => {
      totalAmount += amountEachItem
      totalCost += (amountEachItem * size.selling_price)
    })    
    // Seed store transaction
    const storeTrnsc = await StoreTransaction.create({
      store_id: store.id, total_amount: totalAmount, total_cost: totalCost,
      total_original_cost: totalCost, transaction_date: transactionDate
    })

    // Seed store transaction inventories
    await StoreTransactionInventory.bulkCreate(inventory.sizes.map((size) => ({
      store_transaction_id: storeTrnsc.id, inventory_id: inventory.id, inventory_size_id: size.id,
      amount: amountEachItem, cost: size.selling_price * amountEachItem, original_cost: size.selling_price      
    })))    
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Store_Transactions', null, {});
    await queryInterface.bulkDelete('Store_Transaction_Inventories', null, {});    
  }
};
