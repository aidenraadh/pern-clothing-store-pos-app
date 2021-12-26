'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class StoreInventory extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      models.StoreInventory.belongsTo(
        models.Store, {foreignKey: 'store_id', as: 'store'}
      )
      models.StoreInventory.belongsTo(
        models.Inventory, {foreignKey: 'inventory_id', as: 'inventory'}
      )      
    }
  };
  StoreInventory.init({
    store_id: DataTypes.BIGINT.UNSIGNED,
    inventory_id: DataTypes.BIGINT.UNSIGNED,
    amount: DataTypes.JSON,
  }, {
    sequelize,
    tableName: 'Store_Inventories',    
    modelName: 'StoreInventory',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  StoreInventory.removeAttribute('id');

  return StoreInventory;
};