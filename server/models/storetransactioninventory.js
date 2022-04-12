'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class StoreTransactionInventory extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      models.StoreTransactionInventory.belongsTo(
        models.Inventory, {foreignKey: 'inventory_id', as: 'inventory'}
      ),
      models.StoreTransactionInventory.belongsTo(
        models.InventorySize, {foreignKey: 'inventory_size_id', as: 'size'}
      )      
    }
  };
  StoreTransactionInventory.init({
    store_transaction_id: DataTypes.BIGINT,
    inventory_id: DataTypes.BIGINT,
    inventory_size_id: DataTypes.BIGINT,
    amount: DataTypes.INTEGER,
    cost: DataTypes.INTEGER,
    original_cost: DataTypes.INTEGER,
  }, {
    sequelize,
    modelName: 'StoreTransactionInventory',
    tableName: 'Store_Transaction_Inventories',
    createdAt: 'created_at',
    updatedAt: 'updated_at',     
  });
  return StoreTransactionInventory;
};