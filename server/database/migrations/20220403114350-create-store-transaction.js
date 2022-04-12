'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Store_Transactions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      store_id: {
        type: Sequelize.BIGINT,
        allowNull: false  
      },     
      total_amount: {
        type: Sequelize.INTEGER,
        allowNull: true          
      },     
      total_cost: {
        type: Sequelize.INTEGER,
        allowNull: true          
      },    
      total_original_cost: {
        type: Sequelize.INTEGER,
        allowNull: true          
      },              
      transaction_date: {
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
    // Add foreign key to store_id
    await queryInterface.addConstraint('Store_Transactions', {
      fields: ['store_id'],
      type: 'foreign key',
      name: 'fk_store_transactions_store_id',
      references: {
        table: 'Stores',
        field: 'id',
      }
    })      
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('Store_Transactions', 'fk_store_transactions_store_id');
    await queryInterface.dropTable('Store_Transactions');
  }
};