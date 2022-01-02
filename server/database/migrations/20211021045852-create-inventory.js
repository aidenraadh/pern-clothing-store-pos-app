'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Inventories', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      name: {
        allowNull: false,
        type: Sequelize.STRING(100)
      },     
      owner_id: {
        type: Sequelize.DataTypes.BIGINT,
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
      name: 'fk_inventories_owner_id',
      references: {
        table: 'Owners',
        field: 'id',

      }
    })     
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('Inventories', 'fk_inventories_owner_id');
    await queryInterface.dropTable('Inventories');
  }
};