'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Store_Inventory_Sizes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },       
      store_inventory_id: {
        type: Sequelize.BIGINT,
        allowNull: false  
      },
      inventory_size_id: {
        type: Sequelize.BIGINT,
        allowNull: false  
      },
      amount: {
        type: Sequelize.SMALLINT,
        allowNull: true  
      },      
    });

    // Add foreign key to store_inventory_id
    await queryInterface.addConstraint('Store_Inventory_Sizes', {
      fields: ['store_inventory_id'],
      type: 'foreign key',
      name: 'fk_store_inventory_sizes_store_inventory_id',
      references: {
        table: 'Store_Inventories',
        field: 'id',
      }
    }) 

    // Add foreign key to inventory_size_id
    await queryInterface.addConstraint('Store_Inventory_Sizes', {
      fields: ['inventory_size_id'],
      type: 'foreign key',
      name: 'fk_store_inventory_sizes_inventory_size_id',
      references: {
        table: 'Inventory_Sizes',
        field: 'id',
      }
    })                   
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('Store_Inventory_Sizes', 'fk_store_inventory_sizes_store_inventory_id');
    await queryInterface.removeConstraint('Store_Inventory_Sizes', 'fk_store_inventory_sizes_inventory_size_id');  
    await queryInterface.dropTable('Store_Inventory_Sizes');
  }
};