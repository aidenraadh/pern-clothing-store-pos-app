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
      models.StoreInventory.hasMany(
        models.StoreInventorySize, {foreignKey: 'store_inventory_id', as: 'sizes'}
      )      
    }
  };
  StoreInventory.init({
    store_id: DataTypes.BIGINT,
    inventory_id: DataTypes.BIGINT,
    total_amount: DataTypes.INTEGER,
  }, {
    sequelize,
    paranoid: true,
    tableName: 'store_inventories',    
    modelName: 'StoreInventory',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
  });

  return StoreInventory;
};