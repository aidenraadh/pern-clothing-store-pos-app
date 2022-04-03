'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Store_Transaction_Inventories', {
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
      original_cost: {
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
    await queryInterface.addConstraint('Store_Transaction_Inventories', {
      fields: ['store_transaction_id'],
      type: 'foreign key',
      name: 'fk_store_transaction_inventories_store_transaction_id',
      references: {
        table: 'Store_Transactions',
        field: 'id',
      }
    })      
    // Add foreign key to inventory_id
    await queryInterface.addConstraint('Store_Transaction_Inventories', {
      fields: ['inventory_id'],
      type: 'foreign key',
      name: 'fk_store_transaction_inventories_inventory_id',
      references: {
        table: 'Inventories',
        field: 'id',
      }
    })      
    // Add foreign key to inventory_id
    await queryInterface.addConstraint('Store_Transaction_Inventories', {
      fields: ['inventory_size_id'],
      type: 'foreign key',
      name: 'fk_store_transaction_inventories_inventory_size_id',
      references: {
        table: 'Inventory_Sizes',
        field: 'id',
      }
    })     
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('Store_Transaction_Inventories', 'fk_store_transaction_inventories_store_transaction_id');
    await queryInterface.removeConstraint('Store_Transaction_Inventories', 'fk_store_transaction_inventories_inventory_id');
    await queryInterface.removeConstraint('Store_Transaction_Inventories', 'fk_store_transaction_inventories_inventory_size_id');
    await queryInterface.dropTable('Store_Transaction_Inventories');
  }
};