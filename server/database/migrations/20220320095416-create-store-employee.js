'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Store_Employees', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      store_id: {
        type: Sequelize.BIGINT,
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
    // Add foreign key to user_id
    await queryInterface.addConstraint('Store_Employees', {
      fields: ['user_id'],
      type: 'foreign key',
      name: 'fk_store_employees_user_id',
      references: {
        table: 'Users',
        field: 'id',
      }
    })    
    // Add foreign key to store_id
    await queryInterface.addConstraint('Store_Employees', {
      fields: ['store_id'],
      type: 'foreign key',
      name: 'fk_store_employees_store_id',
      references: {
        table: 'Stores',
        field: 'id',
      }
    })        
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('Store_Employees', 'fk_store_employees_user_id');
    await queryInterface.removeConstraint('Store_Employees', 'fk_store_employees_store_id');    
    await queryInterface.dropTable('Store_Employees');
  }
};