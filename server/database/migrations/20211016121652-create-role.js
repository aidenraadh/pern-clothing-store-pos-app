'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('roles', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.SMALLINT
      },
      name: {
        allowNull: false,
        type: Sequelize.STRING(20)
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
    // Add unique constraint to name
    await queryInterface.addConstraint('roles', {
      fields: ['name'],
      type: 'unique',
      name: 'unq_roles',
    })      
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('roles', 'unq_roles');    
    await queryInterface.dropTable('roles');
  }
};