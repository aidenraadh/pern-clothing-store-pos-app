'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Inventory_Sizes', {
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
    await queryInterface.addConstraint('Inventory_Sizes', {
      fields: ['inventory_id'],
      type: 'foreign key',
      name: 'fk_inventory_sizes_inventory_id',
      references: {
        table: 'Inventories',
        field: 'id',

      }
    })      
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('Inventory_Sizes', 'fk_inventory_sizes_inventory_id');    
    await queryInterface.dropTable('Inventory_Sizes');
  }
};