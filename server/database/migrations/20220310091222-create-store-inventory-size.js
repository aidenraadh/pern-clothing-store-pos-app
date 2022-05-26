'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('store_inventory_sizes', {
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
    await queryInterface.addConstraint('store_inventory_sizes', {
      fields: ['store_inventory_id'],
      type: 'foreign key',
      name: 'fk_store_inventory_sizes_store_inventory_id',
      references: {
        table: 'store_inventories',
        field: 'id',
      }
    }) 

    // Add foreign key to inventory_size_id
    await queryInterface.addConstraint('store_inventory_sizes', {
      fields: ['inventory_size_id'],
      type: 'foreign key',
      name: 'fk_store_inventory_sizes_inventory_size_id',
      references: {
        table: 'inventory_sizes',
        field: 'id',
      }
    })                   
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('store_inventory_sizes', 'fk_store_inventory_sizes_store_inventory_id');
    await queryInterface.removeConstraint('store_inventory_sizes', 'fk_store_inventory_sizes_inventory_size_id');  
    await queryInterface.dropTable('store_inventory_sizes');
  }
};