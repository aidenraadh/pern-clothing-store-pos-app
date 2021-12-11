'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class StoreInvetory extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  StoreInvetory.init({
    store_id: DataTypes.BIGINT,
    inventory_id: DataTypes.BIGINT,
    amount: DataTypes.JSON,
  }, {
    sequelize,
    tableName: 'Store_Inventories',    
    modelName: 'StoreInvetory',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });
  return StoreInvetory;
};