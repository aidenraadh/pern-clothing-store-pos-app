'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class StoreEmployee extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  StoreEmployee.init({
    user_id: DataTypes.BIGINT,
    store_id: DataTypes.BIGINT,
  }, {
    sequelize,
    modelName: 'StoreEmployee',
    tableName: 'Store_Employees',
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',    
  });
  return StoreEmployee;
};