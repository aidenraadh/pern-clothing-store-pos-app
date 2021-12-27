'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Store_Inventories', {
      store_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false  
      },
      inventory_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false          
      },  
      amount: {
        type: Sequelize.JSON,
        allowNull: true 
      },      
      total_amount: {
        type: Sequelize.SMALLINT.UNSIGNED,
        allowNull: false 
      },         
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
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

    // Add composite unique key to store_id and inventory_id
    await queryInterface.addConstraint('Store_Inventories', {
      fields: ['store_id', 'inventory_id'],
      type: 'unique',
      name: 'unq_store_inventories_store_id_inventory_id',
    })       
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('Store_Inventories', 'fk_store_inventories_store_id');
    await queryInterface.removeConstraint('Store_Inventories', 'fk_store_inventories_inventory_id');
    await queryInterface.removeConstraint('Store_Inventories', 'unq_store_inventories_store_id_inventory_id');    
    await queryInterface.dropTable('Store_Inventories');
  }
};