'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class InventorySize extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  InventorySize.init({
    name: DataTypes.STRING(100),
    inventory_id: DataTypes.BIGINT,
    production_price: DataTypes.INTEGER,
    selling_price: DataTypes.INTEGER,
  }, {
    sequelize,
    modelName: 'InventorySize',
    tableName: 'inventory_sizes',
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',    
    deletedAt: 'deleted_at', 
  });
  return InventorySize;
};