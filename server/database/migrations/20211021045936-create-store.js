'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Stores', {
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
    await queryInterface.addConstraint('Stores', {
      fields: ['owner_id'],
      type: 'foreign key',
      name: 'fk_store_owner',
      references: {
        table: 'Owners',
        field: 'id',

      }
    })      
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('Stores', 'fk_store_owner');
    await queryInterface.dropTable('Stores');
  }
};