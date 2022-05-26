'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('store_transactions', {
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
    await queryInterface.addConstraint('store_transactions', {
      fields: ['store_id'],
      type: 'foreign key',
      name: 'fk_store_transactions_store_id',
      references: {
        table: 'stores',
        field: 'id',
      }
    })      
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('store_transactions', 'fk_store_transactions_store_id');
    await queryInterface.dropTable('store_transactions');
  }
};