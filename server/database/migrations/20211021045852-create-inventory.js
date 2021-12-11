'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Inventories', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT.UNSIGNED
      },
      name: {
        allowNull: false,
        type: Sequelize.STRING
      },
      production_prices: {
        allowNull: true,
        type: Sequelize.JSON
      },      
      selling_prices: {
        allowNull: true,
        type: Sequelize.JSON
      },       
      owner_id: {
        type: Sequelize.DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
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

    // Add foreign key to owner_id
    await queryInterface.addConstraint('Inventories', {
      fields: ['owner_id'],
      type: 'foreign key',
      name: 'fk_inventory_owner',
      references: {
        table: 'Owners',
        field: 'id',

      }
    })     
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('Inventories', 'fk_inventory_owner');
    await queryInterface.dropTable('Inventories');
  }
};