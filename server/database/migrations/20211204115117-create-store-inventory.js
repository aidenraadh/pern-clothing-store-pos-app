'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('store_inventories', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },      
      store_id: {
        type: Sequelize.BIGINT,
        allowNull: false  
      },
      inventory_id: {
        type: Sequelize.BIGINT,
        allowNull: false          
      },            
      total_amount: {
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
      deleted_at: {
        allowNull: true,
        type: Sequelize.DATE
      }      
    });  

    // Add foreign key to store_id
    await queryInterface.addConstraint('store_inventories', {
      fields: ['store_id'],
      type: 'foreign key',
      name: 'fk_store_inventories_store_id',
      references: {
        table: 'stores',
        field: 'id',

      }
    })   
    
    // Add foreign key to inventory_id
    await queryInterface.addConstraint('store_inventories', {
      fields: ['inventory_id'],
      type: 'foreign key',
      name: 'fk_store_inventories_inventory_id',
      references: {
        table: 'inventories',
        field: 'id',
      }
    })              
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('store_inventories', 'fk_store_inventories_store_id');
    await queryInterface.removeConstraint('store_inventories', 'fk_store_inventories_inventory_id');
    await queryInterface.dropTable('store_inventories');
  }
};