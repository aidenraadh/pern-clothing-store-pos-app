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
      models.StoreInventorySize.belongsTo(
        models.StoreInventory, {foreignKey: 'store_inventory_id', as: 'storeInv'}
      )               
    }
  };
  StoreInventorySize.init({
    store_inventory_id: DataTypes.BIGINT,
    inventory_size_id: DataTypes.BIGINT,
    amount: DataTypes.SMALLINT,
  }, {
    sequelize,
    tableName: 'store_inventory_sizes',    
    modelName: 'StoreInventorySize',
    timestamps: false,
  });
  
  return StoreInventorySize;
};