'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('inventory_sizes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      inventory_id: {
        type: Sequelize.BIGINT,
        allowNull: false  
      },      
      name: {
        type: Sequelize.STRING(100)
      },
      production_price: {
        allowNull: true,
        type: Sequelize.INTEGER
      },      
      selling_price: {
        allowNull: true,
        type: Sequelize.INTEGER
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

    // Add foreign key to inventory_id
    await queryInterface.addConstraint('inventory_sizes', {
      fields: ['inventory_id'],
      type: 'foreign key',
      name: 'fk_inventory_sizes_inventory_id',
      references: {
        table: 'inventories',
        field: 'id',

      }
    })      
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('inventory_sizes', 'fk_inventory_sizes_inventory_id');    
    await queryInterface.dropTable('inventory_sizes');
  }
};