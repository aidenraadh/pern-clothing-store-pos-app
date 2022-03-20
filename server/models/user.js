'use strict';

const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      models.User.hasOne(
        models.StoreEmployee, {foreignKey: 'user_id', as: 'storeEmployee'}
      )           
    }
  };
  User.init({
    name: DataTypes.STRING(100),
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    role_id: DataTypes.SMALLINT,
    owner_id: DataTypes.BIGINT,
  }, {
    sequelize,
    modelName: 'User',
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    defaultScope: {
      attributes: {exclude: ['password']}
    },
    scopes: {
      withPassword: {
        attributes: {include: ['password']}
      }
    }
  });
  return User;
};