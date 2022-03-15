'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class StoreInventorySize extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {            
    }
  };
  StoreInventorySize.init({
    store_inventory_id: DataTypes.BIGINT,
    inventory_size_id: DataTypes.BIGINT,
    amount: DataTypes.SMALLINT,
  }, {
    sequelize,
    tableName: 'Store_Inventory_Sizes',    
    modelName: 'StoreInventorySize',
    timestamps: false,
  });
  
  return StoreInventorySize;
};