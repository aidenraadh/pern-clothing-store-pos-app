'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },  
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      language_id: {
        type: Sequelize.DataTypes.SMALLINT,
        allowNull: false,
      },        
      role_id: {
        type: Sequelize.DataTypes.SMALLINT,
        allowNull: false,
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

    // Add foreign key to role_id
    await queryInterface.addConstraint('users', {
      fields: ['role_id'],
      type: 'foreign key',
      name: 'fk_users_role_id',
      references: {
        table: 'roles',
        field: 'id',

      }
    })

    // Add foreign key to owner_id
    await queryInterface.addConstraint('users', {
      fields: ['owner_id'],
      type: 'foreign key',
      name: 'fk_users_owner_id',
      references: {
        table: 'owners',
        field: 'id',

      }
    })    
    
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('users', 'fk_users_role_id');
    await queryInterface.removeConstraint('users', 'fk_users_owner_id');
    await queryInterface.dropTable('users');
  }
};