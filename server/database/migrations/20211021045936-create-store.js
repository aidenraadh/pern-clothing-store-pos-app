'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Stores', {
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
      type_id: {
        allowNull: false,
        type: Sequelize.SMALLINT
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
    await queryInterface.addConstraint('Stores', {
      fields: ['owner_id'],
      type: 'foreign key',
      name: 'fk_stores_owner_id',
      references: {
        table: 'Owners',
        field: 'id',

      }
    })      
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('Stores', 'fk_stores_owner_id');
    await queryInterface.dropTable('Stores');
  }
};