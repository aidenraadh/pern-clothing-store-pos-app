'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('store_transaction_inventories', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      store_transaction_id: {
        type: Sequelize.BIGINT,
        allowNull: false  
      },        
      inventory_id: {
        type: Sequelize.BIGINT,
        allowNull: false  
      },  
      inventory_size_id: {
        type: Sequelize.BIGINT,
        allowNull: false  
      },             
      amount: {
        type: Sequelize.INTEGER,
        allowNull: true          
      },    
      cost: {
        type: Sequelize.INTEGER,
        allowNull: true          
      },    
      original_cost_per_inv: {
        type: Sequelize.INTEGER,
        allowNull: true          
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
    });
    // Add foreign key to store_transaction_id
    await queryInterface.addConstraint('store_transaction_inventories', {
      fields: ['store_transaction_id'],
      type: 'foreign key',
      name: 'fk_store_transaction_inventories_store_transaction_id',
      references: {
        table: 'store_transactions',
        field: 'id',
      }
    })      
    // Add foreign key to inventory_id
    await queryInterface.addConstraint('store_transaction_inventories', {
      fields: ['inventory_id'],
      type: 'foreign key',
      name: 'fk_store_transaction_inventories_inventory_id',
      references: {
        table: 'inventories',
        field: 'id',
      }
    })      
    // Add foreign key to inventory_id
    await queryInterface.addConstraint('store_transaction_inventories', {
      fields: ['inventory_size_id'],
      type: 'foreign key',
      name: 'fk_store_transaction_inventories_inventory_size_id',
      references: {
        table: 'inventory_sizes',
        field: 'id',
      }
    })     
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('store_transaction_inventories', 'fk_store_transaction_inventories_store_transaction_id');
    await queryInterface.removeConstraint('store_transaction_inventories', 'fk_store_transaction_inventories_inventory_id');
    await queryInterface.removeConstraint('store_transaction_inventories', 'fk_store_transaction_inventories_inventory_size_id');
    await queryInterface.dropTable('store_transaction_inventories');
  }
};