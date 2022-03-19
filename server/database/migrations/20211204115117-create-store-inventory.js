'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Store_Inventories', {
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
    await queryInterface.addConstraint('Store_Inventories', {
      fields: ['store_id'],
      type: 'foreign key',
      name: 'fk_store_inventories_store_id',
      references: {
        table: 'Stores',
        field: 'id',

      }
    })   
    
    // Add foreign key to inventory_id
    await queryInterface.addConstraint('Store_Inventories', {
      fields: ['inventory_id'],
      type: 'foreign key',
      name: 'fk_store_inventories_inventory_id',
      references: {
        table: 'Inventories',
        field: 'id',
      }
    })              
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('Store_Inventories', 'fk_store_inventories_store_id');
    await queryInterface.removeConstraint('Store_Inventories', 'fk_store_inventories_inventory_id');
    await queryInterface.dropTable('Store_Inventories');
  }
};