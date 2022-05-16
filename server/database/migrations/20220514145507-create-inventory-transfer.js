'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('inventory_transfers', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      inventory_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      inventory_size_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      amount: {
        type: Sequelize.INTEGER,
        allowNull: false,        
      },
      origin_store_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      destination_store_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      transfer_date: {
        allowNull: false,
        type: Sequelize.DATE
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
    await queryInterface.addConstraint('inventory_transfers', {
      fields: ['inventory_id'],
      type: 'foreign key',
      name: 'fk_inventory_transfers_inventory_id',
      references: {
        table: 'Inventories',
        field: 'id',
      }
    })       
    // Add foreign key to inventory_size_id
    await queryInterface.addConstraint('inventory_transfers', {
      fields: ['inventory_size_id'],
      type: 'foreign key',
      name: 'fk_inventory_transfers_inventory_size_id',
      references: {
        table: 'Inventory_Sizes',
        field: 'id',
      }
    })    
    // Add foreign key to origin_store_id
    await queryInterface.addConstraint('inventory_transfers', {
      fields: ['origin_store_id'],
      type: 'foreign key',
      name: 'fk_inventory_transfers_origin_store_id',
      references: {
        table: 'Stores',
        field: 'id',
      }
    })    
    // Add foreign key to destination_store_id
    await queryInterface.addConstraint('inventory_transfers', {
      fields: ['destination_store_id'],
      type: 'foreign key',
      name: 'fk_inventory_transfers_destination_store_id',
      references: {
        table: 'Stores',
        field: 'id',
      }
    })      
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('inventory_transfers', 'fk_inventory_transfers_inventory_id');
    await queryInterface.removeConstraint('inventory_transfers', 'fk_inventory_transfers_inventory_size_id');
    await queryInterface.removeConstraint('inventory_transfers', 'fk_inventory_transfers_origin_store_id');
    await queryInterface.removeConstraint('inventory_transfers', 'fk_inventory_transfers_destination_store_id');
    await queryInterface.dropTable('inventory_transfers');
  }
};